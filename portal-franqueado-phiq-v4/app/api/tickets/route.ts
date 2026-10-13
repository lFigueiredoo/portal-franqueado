import { NextResponse } from 'next/server';
import { serverTickets } from './server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile, data } = body;

    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await serverTickets.createTicket(userId, profile, data);
    return NextResponse.json(ticket);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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

    const profile = { franchiseId, role };
    const tickets = await serverTickets.listTickets(userId, profile);
    return NextResponse.json(tickets);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
