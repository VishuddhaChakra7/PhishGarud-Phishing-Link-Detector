import os
import re
import json
import uuid
import asyncio
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

# Configurations & DB
from config import settings
from db.session import get_db, engine, SessionLocal
from db.models import Base, ScanResult, Feedback

# ML Predictor & Narrative
from ml.predictor import get_prediction_and_explanation
from ml.narrative import generate_narrative

# Telemetry Sync Checkers
from enrichment.whois import check_whois
from enrichment.ssl_inspector import check_ssl
from enrichment.redirect_tracer import trace_redirects
from enrichment.page_analyzer import analyze_page
from enrichment.brand_engine import check_brand
from enrichment.threat_feeds import check_threat_feeds

# ThreadPoolExecutor to run sync checkers concurrently without blocking asyncio event loop
executor = ThreadPoolExecutor(max_workers=12)

async def run_checker_in_executor(func, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, func, *args)

async def process_enrichment_pipeline(scan_id: uuid.UUID, url: str):
    """
    Executes all 6 enrichment checkers concurrently in a thread pool and updates
    the SQLite database record progressively.
    """
    from urllib.parse import urlparse
    import tldextract
    
    parsed_url = urlparse(url)
    hostname = parsed_url.netloc or ""
    ext = tldextract.extract(url)
    registered_domain = f"{ext.domain}.{ext.suffix}".lower()
    domain_without_tld = ext.domain.lower()

    # Define tasks
    tasks = {
        "whois_data": run_checker_in_executor(check_whois, registered_domain),
        "ssl_data": run_checker_in_executor(check_ssl, hostname),
        "redirect_data": run_checker_in_executor(trace_redirects, url),
        "page_data": run_checker_in_executor(analyze_page, url),
        "brand_match_data": run_checker_in_executor(check_brand, domain_without_tld),
        "phishtank_data": run_checker_in_executor(check_threat_feeds, url)
    }

    async def run_and_save(column_name, coro):
        try:
            res_dict = await coro
            # Create a localized session for async SQLite update
            async with SessionLocal() as db:
                stmt = select(ScanResult).where(ScanResult.id == scan_id)
                db_res = await db.execute(stmt)
                scan = db_res.scalar_one_or_none()
                if scan:
                    setattr(scan, column_name, res_dict)
                    db.add(scan)
                    await db.commit()
        except Exception as e:
            print(f"Error in background task for {column_name}: {e}")

    # Gather tasks concurrently
    await asyncio.gather(*(run_and_save(col, coro) for col, coro in tasks.items()))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize SQLite database schemas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Warm up ML pipeline
    try:
        get_prediction_and_explanation("http://warmup.com")
        print("Model pipeline and SHAP explainer loaded successfully.")
    except Exception as e:
        print(f"Error loading ML artifacts: {e}")
        
    yield
    
    # Cleanups
    await engine.dispose()
    executor.shutdown(wait=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import schemas
from schemas.scan import ScanRequest, ScanResponse, FeedbackRequest, EmailScanRequest, EmailScanResponse

def get_clean_url(url: str) -> str:
    url = url.strip()
    if not re.match(r'^https?://', url, re.IGNORECASE):
        url = "http://" + url
    return url

@app.post("/api/scan", response_model=ScanResponse)
async def start_scan(
    request_data: ScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Initial fast scan (sub-200ms). Performs lexical ML inference and dispatches local background tasks.
    """
    raw_url = request_data.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
        
    clean_url = get_clean_url(raw_url)
    
    try:
        # 1. Run lexical ML inference
        ml_results = get_prediction_and_explanation(clean_url)
        proba = ml_results["probability"]
        features = ml_results["features"]
        shap_vals = ml_results["shap_values"]
        
        # Initial verdict based on thresholds
        if proba < 0.35:
            verdict = "SAFE"
        elif proba <= 0.65:
            verdict = "SUSPICIOUS"
        else:
            verdict = "PHISHING"
            
        # 2. Save scan result to Database
        scan_id = uuid.uuid4()
        new_scan = ScanResult(
            id=scan_id,
            url=clean_url,
            verdict=verdict,
            confidence=proba,
            features=features,
            shap_values=shap_vals,
            whois_data=None,
            ssl_data=None,
            redirect_data=None,
            phishtank_data=None,
            brand_match_data=None,
            page_data=None,
            security_tips=None,
            phishtank_override=False,
            scanned_at=datetime.now(timezone.utc)
        )
        db.add(new_scan)
        await db.commit()
        await db.refresh(new_scan)
        
        # 3. Add background progressive enrichment tasks
        background_tasks.add_task(process_enrichment_pipeline, scan_id, clean_url)
        
        stream_url = f"/api/scan/{str(scan_id)}/stream"
        
        return ScanResponse(
            scan_id=scan_id,
            url=clean_url,
            verdict=verdict,
            confidence=proba,
            features=features,
            shap_values=shap_vals,
            stream_url=stream_url,
            scanned_at=new_scan.scanned_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Scan initialization failed: {str(e)}")

@app.get("/api/scan/{scan_id}/stream")
async def stream_scan_results(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    SSE stream endpoint pushing progressive updates as enrichment steps finish.
    """
    async def sse_generator():
        emitted_stages = set()
        start_time = datetime.now()
        timeout_seconds = 15  # Limit stream run time
        
        while True:
            # Query scans table
            stmt = select(ScanResult).where(ScanResult.id == scan_id)
            db_res = await db.execute(stmt)
            scan = db_res.scalar_one_or_none()
            
            if not scan:
                yield f"event: error\ndata: {json.dumps({'error': 'Scan not found'})}\n\n"
                break
                
            # Send live updates for each completed enrichment module
            if scan.whois_data and "whois" not in emitted_stages:
                emitted_stages.add("whois")
                yield f"event: whois_complete\ndata: {json.dumps(scan.whois_data)}\n\n"
                
            if scan.ssl_data and "ssl" not in emitted_stages:
                emitted_stages.add("ssl")
                yield f"event: ssl_complete\ndata: {json.dumps(scan.ssl_data)}\n\n"
                
            if scan.redirect_data and "redirects" not in emitted_stages:
                emitted_stages.add("redirects")
                yield f"event: redirects_complete\ndata: {json.dumps(scan.redirect_data)}\n\n"
                
            if scan.page_data and "page" not in emitted_stages:
                emitted_stages.add("page")
                yield f"event: page_complete\ndata: {json.dumps(scan.page_data)}\n\n"
                
            if scan.brand_match_data and "brand" not in emitted_stages:
                emitted_stages.add("brand")
                yield f"event: brand_complete\ndata: {json.dumps(scan.brand_match_data)}\n\n"
                
            if scan.phishtank_data and "threats" not in emitted_stages:
                emitted_stages.add("threats")
                yield f"event: threats_complete\ndata: {json.dumps(scan.phishtank_data)}\n\n"
                
            # All 6 stages completed OR time limit exceeded
            all_done = len(emitted_stages) == 6
            timed_out = (datetime.now() - start_time).seconds > timeout_seconds
            
            if all_done or timed_out:
                # 1. Run Verdict Fusion Algorithm
                final_proba = float(scan.confidence) 
                
                whois_data = scan.whois_data or {}
                ssl_data = scan.ssl_data or {}
                redirect_data = scan.redirect_data or {}
                page_data = scan.page_data or {}
                brand_data = scan.brand_match_data or {}
                threat_data = scan.phishtank_data or {}
                
                if 0 <= whois_data.get("domain_age_days", -1) < 30:
                    final_proba += 0.15
                    
                if 0 <= ssl_data.get("cert_age_days", -1) < 7:
                    final_proba += 0.12
                    
                if redirect_data.get("hop_count", 0) >= 3 and redirect_data.get("crosses_domain", False):
                    final_proba += 0.10
                    
                if brand_data.get("distance", 999) == 1:
                    final_proba += 0.18
                    
                if page_data.get("has_login_form") and page_data.get("form_action_is_external"):
                    final_proba += 0.14
                    
                final_proba = min(0.99, max(0.01, final_proba))
                
                phishtank_override = False
                if threat_data.get("is_phishing") and threat_data.get("verified"):
                    final_proba = 0.99
                    phishtank_override = True
                
                if final_proba < 0.35:
                    final_verdict = "SAFE"
                elif final_proba <= 0.65:
                    final_verdict = "SUSPICIOUS"
                else:
                    final_verdict = "PHISHING"
                    
                if phishtank_override:
                    final_verdict = "PHISHING"

                # 2. Generate security narrative
                narrative_dict = generate_narrative(
                    whois_data, ssl_data, redirect_data, page_data, brand_data, final_proba
                )
                
                # 3. Save final outputs to database
                scan.verdict = final_verdict
                scan.confidence = final_proba
                scan.phishtank_override = phishtank_override
                scan.security_tips = narrative_dict
                
                db.add(scan)
                await db.commit()
                await db.refresh(scan)
                
                final_payload = {
                    "scan_id": str(scan.id),
                    "url": scan.url,
                    "verdict": scan.verdict,
                    "confidence": scan.confidence,
                    "phishtank_override": scan.phishtank_override,
                    "features": scan.features,
                    "shap_values": scan.shap_values,
                    "whois": whois_data,
                    "ssl": ssl_data,
                    "redirects": redirect_data,
                    "page_analysis": page_data,
                    "brand_match": brand_data,
                    "threat_feeds": threat_data,
                    "security_tips": scan.security_tips,
                    "scanned_at": scan.scanned_at.isoformat()
                }
                
                yield f"event: final_verdict\ndata: {json.dumps(final_payload)}\n\n"
                break
                
            await asyncio.sleep(0.5)
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@app.post("/api/feedback")
async def save_feedback(request_data: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    """
    Saves user feedback about a scan verdict correction.
    """
    stmt = select(ScanResult).where(ScanResult.id == request_data.scan_id)
    res = await db.execute(stmt)
    scan = res.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    feedback = Feedback(
        scan_id=request_data.scan_id,
        correct_verdict=request_data.correct_verdict,
        comment=request_data.comment
    )
    db.add(feedback)
    await db.commit()
    
    return {"status": "ok", "message": "Feedback submitted successfully"}

@app.post("/api/scan/bulk")
async def scan_bulk(
    file: UploadFile = File(...),
    enrich: bool = Query(default=False),
    db: AsyncSession = Depends(get_db)
):
    """
    Processes URLs in bulk from an uploaded CSV file. Limit to 500 rows.
    """
    contents = await file.read()
    lines = contents.decode("utf-8").splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="CSV file is empty")
        
    header = lines[0].split(",")
    url_col_idx = -1
    for idx, h in enumerate(header):
        if h.strip().lower() == "url":
            url_col_idx = idx
            break
            
    if url_col_idx == -1:
        raise HTTPException(status_code=400, detail="CSV must contain a column named 'url'")
        
    urls = []
    for line in lines[1:501]:
        parts = line.split(",")
        if len(parts) > url_col_idx:
            url_val = parts[url_col_idx].strip()
            if url_val:
                urls.append(url_val)
                
    if not urls:
        raise HTTPException(status_code=400, detail="No URLs found in the CSV")
        
    results_list = []
    summary = {"total": len(urls), "phishing": 0, "safe": 0, "suspicious": 0}
    
    for raw_url in urls:
        clean_url = get_clean_url(raw_url)
        ml_results = get_prediction_and_explanation(clean_url)
        proba = ml_results["probability"]
        
        if proba < 0.35:
            verdict = "SAFE"
            summary["safe"] += 1
        elif proba <= 0.65:
            verdict = "SUSPICIOUS"
            summary["suspicious"] += 1
        else:
            verdict = "PHISHING"
            summary["phishing"] += 1
            
        results_list.append({
            "url": clean_url,
            "verdict": verdict,
            "confidence": round(proba, 4),
            "scanned_at": datetime.now(timezone.utc).isoformat()
        })
        
    return {
        "summary": summary,
        "scans": results_list
    }

@app.post("/api/scan/email", response_model=EmailScanResponse)
async def scan_email_content(request_data: EmailScanRequest, db: AsyncSession = Depends(get_db)):
    """
    Parses a raw email block, extracts all unique HTTP/HTTPS links, and batch scans them.
    """
    email_text = request_data.email_text
    url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
    urls_found = re.findall(url_pattern, email_text)
    
    unique_urls = []
    seen = set()
    for u in urls_found:
        u_clean = u.rstrip(".,;:)!]?'\"")
        u_formatted = get_clean_url(u_clean)
        if u_formatted not in seen:
            seen.add(u_formatted)
            unique_urls.append(u_formatted)
            
    scans_list = []
    phishing_count = 0
    safe_count = 0
    suspicious_count = 0
    most_dangerous_url = None
    highest_proba = -1.0
    
    for url in unique_urls:
        ml_results = get_prediction_and_explanation(url)
        proba = ml_results["probability"]
        
        if proba < 0.35:
            verdict = "SAFE"
            safe_count += 1
        elif proba <= 0.65:
            verdict = "SUSPICIOUS"
            suspicious_count += 1
        else:
            verdict = "PHISHING"
            phishing_count += 1
            
        if proba > highest_proba:
            highest_proba = proba
            most_dangerous_url = url
            
        scan_id = uuid.uuid4()
        from schemas.scan import ScanResponse
        scan_resp = ScanResponse(
            scan_id=scan_id,
            url=url,
            verdict=verdict,
            confidence=proba,
            features=ml_results["features"],
            shap_values=ml_results["shap_values"],
            stream_url=f"/api/scan/{str(scan_id)}/stream",
            scanned_at=datetime.now(timezone.utc)
        )
        scans_list.append(scan_resp)
        
    return EmailScanResponse(
        total_links_found=len(unique_urls),
        phishing_count=phishing_count,
        safe_count=safe_count,
        most_dangerous_url=most_dangerous_url,
        scans=scans_list
    )

@app.get("/api/history")
async def get_scan_history(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1),
    verdict: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a paginated list of past scans.
    """
    stmt = select(ScanResult)
    
    if verdict:
        stmt = stmt.where(ScanResult.verdict == verdict.upper())
    if search:
        stmt = stmt.where(ScanResult.url.contains(search))
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_res = await db.execute(count_stmt)
    total_items = count_res.scalar() or 0
    
    stmt = stmt.order_by(desc(ScanResult.scanned_at)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(stmt)
    scans = res.scalars().all()
    
    items = []
    for s in scans:
        ext = tldextract.extract(s.url)
        domain = f"{ext.domain}.{ext.suffix}"
        
        age = -1
        if s.whois_data:
            age = s.whois_data.get("domain_age_days", -1)
            
        items.append({
            "scan_id": str(s.id),
            "url": s.url,
            "domain": domain,
            "verdict": s.verdict,
            "confidence": s.confidence,
            "domain_age": age,
            "scanned_at": s.scanned_at.isoformat()
        })
        
    total_pages = (total_items + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total_items,
        "page": page,
        "pages": total_pages
    }

@app.get("/api/scan/{scan_id}")
async def get_scan_by_id(scan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Returns the complete scans details from SQLite by scan UUID.
    """
    stmt = select(ScanResult).where(ScanResult.id == scan_id)
    res = await db.execute(stmt)
    scan = res.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    return {
        "scan_id": str(scan.id),
        "url": scan.url,
        "verdict": scan.verdict,
        "confidence": scan.confidence,
        "phishtank_override": scan.phishtank_override,
        "features": scan.features,
        "shap_values": scan.shap_values,
        "whois": scan.whois_data,
        "ssl": scan.ssl_data,
        "redirects": scan.redirect_data,
        "page_analysis": scan.page_data,
        "brand_match": scan.brand_match_data,
        "threat_feeds": scan.phishtank_data,
        "security_tips": scan.security_tips,
        "scanned_at": scan.scanned_at.isoformat()
    }

@app.get("/api/stats")
async def get_aggregate_stats(db: AsyncSession = Depends(get_db)):
    """
    Computes aggregate metrics from SQLite scan logs history.
    """
    stmt = select(ScanResult.verdict, func.count(ScanResult.verdict)).group_by(ScanResult.verdict)
    res = await db.execute(stmt)
    counts = dict(res.all())
    
    total = sum(counts.values())
    phishing = counts.get("PHISHING", 0)
    safe = counts.get("SAFE", 0)
    suspicious = counts.get("SUSPICIOUS", 0)
    
    phishing_percentage = (phishing / total * 100) if total > 0 else 0.0
    
    avg_conf_stmt = select(func.avg(ScanResult.confidence))
    avg_conf_res = await db.execute(avg_conf_stmt)
    avg_confidence = avg_conf_res.scalar() or 0.0
    
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # SQLite compatible date grouping (using strftime instead of postgres date_trunc)
    spark_stmt = (
        select(func.strftime('%Y-%m-%d', ScanResult.scanned_at).label('date'), func.count())
        .where(ScanResult.scanned_at >= seven_days_ago)
        .group_by('date')
        .order_by('date')
    )
    spark_res = await db.execute(spark_stmt)
    scans_last_7_days = [{"date": r[0], "count": r[1]} for r in spark_res.all()]
    
    tld_stmt = select(ScanResult.url).where(ScanResult.verdict == "PHISHING")
    tld_res = await db.execute(tld_stmt)
    urls = tld_res.scalars().all()
    
    tld_counts = {}
    import tldextract
    for u in urls:
        ext = tldextract.extract(u)
        tld = ext.suffix.lower()
        if tld:
            tld_counts[tld] = tld_counts.get(tld, 0) + 1
            
    top_tlds = [{"tld": k, "count": v} for k, v in sorted(tld_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
    
    shap_stmt = select(ScanResult.shap_values).where(ScanResult.verdict == "PHISHING").limit(200)
    shap_res = await db.execute(shap_stmt)
    phish_shaps = shap_res.scalars().all()
    
    feature_impacts = {}
    feature_counts = {}
    for shap_list in phish_shaps:
        if not shap_list:
            continue
        for item in shap_list:
            f_name = item.get("display_name")
            shap_val = item.get("shap", 0.0)
            if shap_val > 0:
                feature_impacts[f_name] = feature_impacts.get(f_name, 0.0) + shap_val
                feature_counts[f_name] = feature_counts.get(f_name, 0) + 1
                
    avg_shaps = []
    for f, total_shap in feature_impacts.items():
        count = feature_counts[f]
        avg_shaps.append({"feature": f, "avg_shap": round(total_shap / count, 4)})
        
    avg_shaps.sort(key=lambda x: x["avg_shap"], reverse=True)
    
    return {
        "total_scans": total,
        "phishing_count": phishing,
        "safe_count": safe,
        "suspicious_count": suspicious,
        "phishing_percentage": round(phishing_percentage, 2),
        "avg_confidence": round(float(avg_confidence) * 100, 2),
        "top_phishing_tlds": top_tlds,
        "scans_last_7_days": scans_last_7_days,
        "most_common_phishing_features": avg_shaps[:10]
    }
