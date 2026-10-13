import { NextResponse } from 'next/server';
import { serverTickets } from '../server';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, userId, profile, status } = body;

    if (!ticketId || !userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await serverTickets.updateTicketStatus(ticketId, userId, profile, { status });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
