export const resolveServiceUrl = (taskNumber, envUrl, fallback) => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // 1. Automatically match any Render deployment host, e.g. ai-tech-consultant-frontend-2g68.onrender.com
    const match = host.match(/ai-tech-consultant-frontend(-[a-z0-9]+)?\.onrender\.com/i);
    if (match) {
      const suffix = match[1] || '';
      return `https://ai-tech-consultant-task${taskNumber}${suffix}.onrender.com`;
    }

    // 2. If hosted on Vercel (*.vercel.app) or any cloud domain outside localhost
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      if (envUrl && envUrl.trim()) {
        const cleanEnv = envUrl.trim().replace(/\/$/, '');
        return cleanEnv.startsWith('http://') || cleanEnv.startsWith('https://') ? cleanEnv : `https://${cleanEnv}`;
      }
      // Production live Render microservices defaults
      return `https://ai-tech-consultant-task${taskNumber}-2g68.onrender.com`;
    }
  }

  const target = (envUrl && envUrl.trim()) ? envUrl.trim() : fallback;
  if (!target) return '';
  const clean = target.replace(/\/$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return `https://${clean}`;
  }
  return clean;
};

export const formatServiceUrl = (url, fallback) => resolveServiceUrl(1, url, fallback);

export const T1_URL = resolveServiceUrl(1, import.meta.env.VITE_TASK1_URL, 'http://localhost:8001');
export const T2_URL = resolveServiceUrl(2, import.meta.env.VITE_TASK2_URL, 'http://localhost:8002');
export const T3_URL = resolveServiceUrl(3, import.meta.env.VITE_TASK3_URL, 'http://localhost:8003');

