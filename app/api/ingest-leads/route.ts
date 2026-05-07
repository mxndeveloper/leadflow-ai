import { supabase } from '@/lib/db';
import { NextResponse } from 'next/server';

type IncomingLead = {
  address?: string;
  price?: number;
  owner_name?: string;
  phone?: string;
  days_on_market?: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leads = Array.isArray(body) ? body : [body];
    const leadsToInsert = leads.map((lead: IncomingLead) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      address: lead.address || null,
      price: lead.price || null,
      owner_name: lead.owner_name || null,
      phone: lead.phone || null,
      days_on_market: lead.days_on_market || null,
      status: 'new',
      created_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('leads').insert(leadsToInsert);
    if (error) throw error;
    return NextResponse.json({ success: true, inserted: leadsToInsert.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}