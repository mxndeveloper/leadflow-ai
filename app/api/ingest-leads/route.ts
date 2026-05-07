import { NextResponse } from 'next/server';
import { db, type Lead } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leads = Array.isArray(body) ? body : [body];

    await db.read();

    const newLeads: Lead[] = leads.map((lead, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      address: lead.address || null,
      price: lead.price ? Number(lead.price) : null,
      owner_name: lead.owner_name || null,
      phone: lead.phone || null,
      days_on_market: lead.days_on_market ? Number(lead.days_on_market) : null,
      motivation_score: null,
      status: 'new',
      created_at: new Date().toISOString(),
    }));

    db.data.leads.push(...newLeads);
    await db.write();

    return NextResponse.json({ success: true, inserted: newLeads.length });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  await db.read();
  return NextResponse.json(db.data.leads);
}