import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leads = Array.isArray(body) ? body : [body];

    for (const lead of leads) {
      const id = `${Date.now()}-${Math.random(). toString(36).substring(2, 8)}`;
      await sql`
        INSERT INTO leads (id, address, price, owner_name, phone, days_on_market, status, created_at)
        VALUES (${id}, ${lead.address || null}, ${lead.price || null}, ${lead.owner_name || null}, ${lead.phone || null}, ${lead.days_on_market || null}, 'new', NOW())
      `;
    }
    return NextResponse.json({ success: true, inserted: leads.length });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}