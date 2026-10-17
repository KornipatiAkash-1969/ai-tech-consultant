import { Task1SearchResult, Task1ChatResponse } from './types';

export class Task1Client {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.TASK1_API_URL || 'http://localhost:8001') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async search(query: string, topK: number = 3, category?: string): Promise<Task1SearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: topK, category, min_score: 0.20 }),
        signal: AbortSignal.timeout(1500),
      });

      if (!response.ok) {
        console.warn(`[Task1Client] Search returned status ${response.status}`);
        return [];
      }

      return (await response.json()) as Task1SearchResult[];
    } catch (err) {
      console.error(`[Task1Client] Failed to reach Task 1 API at ${this.baseUrl}:`, (err as Error).message);
      return [];
    }
  }

  async chat(question: string): Promise<Task1ChatResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        console.warn(`[Task1Client] Chat returned status ${response.status}`);
        return null;
      }

      return (await response.json()) as Task1ChatResponse;
    } catch (err) {
      console.error(`[Task1Client] Chat request failed:`, (err as Error).message);
      return null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
