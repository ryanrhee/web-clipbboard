import { kv } from '@vercel/kv';

export interface ClipboardData {
  content: string;
  timestamp: number;
}

// In-memory fallback for local development without KV
const memoryStore: { [key: string]: ClipboardData } = {};

export async function getClipboard(id: string): Promise<ClipboardData> {
  try {
    // Try to use Vercel KV if configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const value = await kv.get<ClipboardData>(`clipboard:${id}`);
      return value || { content: '', timestamp: 0 };
    }
  } catch (error) {
    console.warn('KV not available, using in-memory storage', error);
  }
  
  // Fallback to in-memory storage
  return memoryStore[id] || { content: '', timestamp: 0 };
}

export async function setClipboard(id: string, content: string): Promise<void> {
  const data: ClipboardData = {
    content,
    timestamp: Date.now()
  };

  try {
    // Try to use Vercel KV if configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      // Set with 7 days expiration
      await kv.set(`clipboard:${id}`, data, { ex: 60 * 60 * 24 * 7 });
      return;
    }
  } catch (error) {
    console.warn('KV not available, using in-memory storage', error);
  }
  
  // Fallback to in-memory storage
  memoryStore[id] = data;
}