import { NextResponse } from 'next/server';
import { serverTickets } from '../server';
import type { Profile } from '@/types/portal';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, userId, profile, status } = body;

    if (!ticketId || !userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileTyped = profile as Profile;
    const updated = await serverTickets.updateTicketStatus(ticketId, userId, profileTyped, { status });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
