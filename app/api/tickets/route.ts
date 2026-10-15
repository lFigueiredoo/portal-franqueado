import { NextResponse } from 'next/server';
import { serverTickets } from './server';
import { getAuthenticatedContext } from '@/src/lib/appwrite/server-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile } = await getAuthenticatedContext(req);
    const ticket = await serverTickets.createTicket(userId, profile, body.data);
    return NextResponse.json(ticket);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId, profile } = await getAuthenticatedContext(req);
    const tickets = await serverTickets.listTickets(userId, profile);
    return NextResponse.json(tickets);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
