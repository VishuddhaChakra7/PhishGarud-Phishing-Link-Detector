import { useEffect, useRef } from 'react';
import { useScanStore } from '../store/scanStore';
import { useNavigate } from 'react-router-dom';

export const useScanStream = () => {
  const navigate = useNavigate();
  const activeScanId = useScanStore((state) => state.activeScanId);
  const startNewScan = useScanStore((state) => state.startNewScan);
  const setScanStep = useScanStore((state) => state.setScanStep);
  const addCompletedStage = useScanStore((state) => state.addCompletedStage);
  const updateStageData = useScanStore((state) => state.updateStageData);
  const setFinalResult = useScanStore((state) => state.setFinalResult);
  const setScanning = useScanStore((state) => state.setScanning);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!activeScanId) return;

    // Connect to SSE stream
    // In production we proxy through /api/, in local dev we can connect to /api/scan/...
    const streamUrl = `/api/scan/${activeScanId}/stream`;
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('whois_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('whois', data);
      addCompletedStage('whois');
      setScanStep("WHOIS records parsed successfully...");
    });

    eventSource.addEventListener('ssl_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('ssl', data);
      addCompletedStage('ssl');
      setScanStep("SSL certificate details inspected...");
    });

    eventSource.addEventListener('redirects_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('redirects', data);
      addCompletedStage('redirects');
      setScanStep("Redirection routing mapped...");
    });

    eventSource.addEventListener('page_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('page', data);
      addCompletedStage('page');
      setScanStep("DOM script structures analyzed...");
    });

    eventSource.addEventListener('brand_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('brand', data);
      addCompletedStage('brand');
      setScanStep("Typosquatting search complete...");
    });

    eventSource.addEventListener('threats_complete', (e: any) => {
      const data = JSON.parse(e.data);
      updateStageData('threats', data);
      addCompletedStage('threats');
      setScanStep("Feeds verification returned...");
    });

    eventSource.addEventListener('final_verdict', (e: any) => {
      const data = JSON.parse(e.data);
      setFinalResult(data);
      eventSource.close();
      setScanning(false);
      // Navigate directly to results detail page
      navigate(`/results/${activeScanId}`);
    });

    eventSource.addEventListener('error', (e: any) => {
      console.error("SSE Connection error", e);
      setScanStep("Error communicating with threat stream.");
      setScanning(false);
      eventSource.close();
    });

    eventSource.onerror = (e) => {
      console.error("EventSource encountered an error", e);
      eventSource.close();
      setScanning(false);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [activeScanId, navigate, startNewScan, setScanStep, addCompletedStage, updateStageData, setFinalResult, setScanning]);

  const initiateScan = (scanId: string) => {
    startNewScan(scanId);
  };

  return { initiateScan };
};
