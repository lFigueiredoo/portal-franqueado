import { NextResponse } from 'next/server';
import { serverTickets } from './server';
import type { Profile, PortalRole } from '@/types/portal';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile, data } = body;

    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileTyped = profile as Profile;
    const ticket = await serverTickets.createTicket(userId, profileTyped, data);
    return NextResponse.json(ticket);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const franchiseId = searchParams.get('franchiseId');
    const role = searchParams.get('role');

    if (!userId || !franchiseId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const profile = { id: franchiseId, role: role as PortalRole } as Profile;
    const tickets = await serverTickets.listTickets(userId, profile);
    return NextResponse.json(tickets);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
