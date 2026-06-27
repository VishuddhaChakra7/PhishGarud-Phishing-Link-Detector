import requests
from bs4 import BeautifulSoup
import tldextract
from urllib.parse import urlparse, urljoin

def analyze_page(url: str, html_content: str = None) -> dict:
    """
    Fetches and parses the HTML of the URL.
    Analyzes forms, scripts, iframes, favicons, right-click locking,
    mouseover status changes, and external resource counts without executing JS.
    """
    result = {
        "has_login_form": False,
        "form_action_is_external": False,
        "count_iframes": 0,
        "has_favicon_from_external": False,
        "count_scripts": 0,
        "right_click_disabled": False,
        "has_mouseover_trick": False,
        "has_meta_refresh": False,
        "count_external_resources": 0,
        "error": None
    }
    
    try:
        # 1. Fetch HTML if not provided
        if html_content is None:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = requests.get(url, timeout=5, headers=headers)
            html_content = response.text
            
        # Parse page domain
        page_ext = tldextract.extract(url)
        page_reg_domain = f"{page_ext.domain}.{page_ext.suffix}".lower()
        
        # 2. BeautifulSoup Parsing
        soup = BeautifulSoup(html_content, "html.parser")
        
        # has_login_form & form_action_is_external
        forms = soup.find_all("form")
        for form in forms:
            # Check if form contains password inputs
            pass_inputs = form.find_all("input", type="password")
            if pass_inputs:
                result["has_login_form"] = True
                
                action = form.get("action")
                if action:
                    # Resolve full URL for action
                    full_action_url = urljoin(url, action)
                    action_ext = tldextract.extract(full_action_url)
                    action_reg_domain = f"{action_ext.domain}.{action_ext.suffix}".lower()
                    
                    if action_reg_domain and action_reg_domain != page_reg_domain:
                        result["form_action_is_external"] = True
        
        # count_iframes
        iframes = soup.find_all("iframe")
        result["count_iframes"] = len(iframes)
        
        # count_scripts
        scripts = soup.find_all("script")
        result["count_scripts"] = len(scripts)
        
        # right_click_disabled & has_mouseover_trick checks in script content
        script_text_combined = ""
        for s in scripts:
            if s.string:
                script_text_combined += s.string.lower()
                
        # Check raw html body tag attribute handlers too
        body_tag = soup.find("body")
        body_str = ""
        if body_tag:
            body_str = str(body_tag).lower()
            
        # right_click_disabled detection
        rc_patterns = ["oncontextmenu", "event.button==2", "event.button == 2", "contextmenu", "preventdefault"]
        for pattern in rc_patterns:
            if pattern in script_text_combined or pattern in body_str:
                result["right_click_disabled"] = True
                break
                
        # has_mouseover_trick detection
        mo_patterns = ["window.status", "window.defaultstatus", "mouseover"]
        for pattern in mo_patterns:
            if pattern in script_text_combined:
                result["has_mouseover_trick"] = True
                break
                
        # has_meta_refresh
        meta_tags = soup.find_all("meta")
        for meta in meta_tags:
            http_equiv = meta.get("http-equiv", "").lower()
            if http_equiv == "refresh":
                result["has_meta_refresh"] = True
                break
                
        # has_favicon_from_external
        favicon_links = soup.find_all("link", rel=lambda x: x and any(rel in x.lower() for rel in ["icon", "shortcut"]))
        for fav in favicon_links:
            href = fav.get("href")
            if href:
                full_fav_url = urljoin(url, href)
                fav_ext = tldextract.extract(full_fav_url)
                fav_reg_domain = f"{fav_ext.domain}.{fav_ext.suffix}".lower()
                if fav_reg_domain and fav_reg_domain != page_reg_domain:
                    result["has_favicon_from_external"] = True
                    break
                    
        # count_external_resources (CSS, JS, Images pointing to external domains)
        external_res_count = 0
        
        # CSS link checks
        css_links = soup.find_all("link", rel="stylesheet")
        for css in css_links:
            href = css.get("href")
            if href:
                full_css_url = urljoin(url, href)
                css_ext = tldextract.extract(full_css_url)
                css_reg_domain = f"{css_ext.domain}.{css_ext.suffix}".lower()
                if css_reg_domain and css_reg_domain != page_reg_domain:
                    external_res_count += 1
                    
        # Script src checks
        for s in scripts:
            src = s.get("src")
            if src:
                full_src_url = urljoin(url, src)
                src_ext = tldextract.extract(full_src_url)
                src_reg_domain = f"{src_ext.domain}.{src_ext.suffix}".lower()
                if src_reg_domain and src_reg_domain != page_reg_domain:
                    external_res_count += 1
                    
        # Image src checks
        images = soup.find_all("img")
        for img in images:
            src = img.get("src")
            if src:
                full_img_url = urljoin(url, src)
                img_ext = tldextract.extract(full_img_url)
                img_reg_domain = f"{img_ext.domain}.{img_ext.suffix}".lower()
                if img_reg_domain and img_reg_domain != page_reg_domain:
                    external_res_count += 1
                    
        result["count_external_resources"] = external_res_count
        
    except Exception as e:
        result["error"] = str(e)
        
    return result
