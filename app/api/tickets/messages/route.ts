import { NextResponse } from 'next/server';
import { serverTickets } from '../server';
import type { Profile, PortalRole } from '@/types/portal';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const userId = searchParams.get('userId');
    const franchiseId = searchParams.get('franchiseId');
    const role = searchParams.get('role');

    if (!ticketId || !userId || !franchiseId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // We map the search params to a Profile-like object for the server helper
    const profile = { id: franchiseId, role: role as PortalRole } as Profile;
    const messages = await serverTickets.listMessages(ticketId, userId, profile);
    return NextResponse.json(messages);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, userId, profile, message } = body;

    if (!ticketId || !userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileTyped = profile as Profile;
    const msg = await serverTickets.addMessage(ticketId, userId, profileTyped, { message });
    return NextResponse.json(msg);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
