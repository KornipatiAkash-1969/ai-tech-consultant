export const formatServiceUrl = (url, fallback) => {
  const target = (url && url.trim()) ? url.trim() : fallback;
  if (!target) return '';
  const clean = target.replace(/\/$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return `https://${clean}`;
  }
  return clean;
};

export const T1_URL = formatServiceUrl(import.meta.env.VITE_TASK1_URL, 'http://localhost:8001');
export const T2_URL = formatServiceUrl(import.meta.env.VITE_TASK2_URL, 'http://localhost:8002');
export const T3_URL = formatServiceUrl(import.meta.env.VITE_TASK3_URL, 'http://localhost:8003');
