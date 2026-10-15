import { NextResponse } from 'next/server';
import { serverTickets } from '../server';
import { getAuthenticatedContext } from '@/src/lib/appwrite/server-auth';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, status } = body;
    const { userId, profile } = await getAuthenticatedContext(req);

    if (!ticketId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await serverTickets.updateTicketStatus(ticketId, userId, profile, { status });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
