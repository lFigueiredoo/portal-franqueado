import { NextResponse } from 'next/server';
import { serverTickets } from '../server';
import { getAuthenticatedContext } from '@/src/lib/appwrite/server-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const { userId, profile } = await getAuthenticatedContext(req);

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const messages = await serverTickets.listMessages(ticketId, userId, profile);
    return NextResponse.json(messages);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, message } = body;
    const { userId, profile } = await getAuthenticatedContext(req);

    if (!ticketId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const msg = await serverTickets.addMessage(ticketId, userId, profile, { message });
    return NextResponse.json(msg);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
