import { NextResponse } from 'next/server';
import { getClipboard, setClipboard } from '@/lib/kv';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'default';
  
  const data = await getClipboard(id);
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, id = 'default' } = body;
    
    await setClipboard(id, content);
    
    return NextResponse.json({ success: true, message: 'Content saved' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 400 }
    );
  }
}