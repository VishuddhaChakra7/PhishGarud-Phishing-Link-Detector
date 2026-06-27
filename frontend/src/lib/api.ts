export interface ScanResponsePayload {
  scan_id: string;
  url: string;
  verdict: string;
  confidence: number;
  stream_url: string;
  scanned_at: string;
}

export const postScan = async (url: string): Promise<any> => {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Scan request failed');
  }
  return response.json();
};

export const postEmailScan = async (emailText: string): Promise<any> => {
  const response = await fetch('/api/scan/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_text: emailText })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Email link parsing failed');
  }
  return response.json();
};

export const postFeedback = async (scanId: string, verdict: string, comment?: string): Promise<any> => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scan_id: scanId,
      correct_verdict: verdict,
      comment: comment || null
    })
  });
  if (!response.ok) {
    throw new Error('Feedback submission failed');
  }
  return response.json();
};

export const postBulkScan = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/scan/bulk', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Bulk scan failed');
  }
  return response.json();
};

export const getScanDetails = async (scanId: string): Promise<any> => {
  const response = await fetch(`/api/scan/${scanId}`);
  if (!response.ok) {
    throw new Error('Failed to retrieve scan detail metrics');
  }
  return response.json();
};

export const getHistory = async (page: number, perPage: number, verdict?: string, search?: string): Promise<any> => {
  let query = `/api/history?page=${page}&per_page=${perPage}`;
  if (verdict && verdict !== 'ALL') {
    query += `&verdict=${verdict}`;
  }
  if (search) {
    query += `&search=${encodeURIComponent(search)}`;
  }
  const response = await fetch(query);
  if (!response.ok) {
    throw new Error('Failed to fetch historical scan list');
  }
  return response.json();
};

export const getStats = async (): Promise<any> => {
  const response = await fetch('/api/stats');
  if (!response.ok) {
    throw new Error('Failed to load aggregate stats');
  }
  return response.json();
};
