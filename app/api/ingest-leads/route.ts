import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define the shape of incoming lead (no 'any')
type IncomingLead = {
  address?: string;
  price?: number;
  owner_name?: string;
  phone?: string;
  days_on_market?: number;
};

// Create a Supabase admin client using the service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leads = Array.isArray(body) ? body : [body];

    // Log the incoming request (helps debugging)
    console.log('📥 Received leads:', JSON.stringify(leads, null, 2));

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

    console.log('📝 Inserting leads:', JSON.stringify(leadsToInsert, null, 2));

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      // Return the actual error message so we can fix it
      return NextResponse.json(
        { error: `Supabase error: ${error.message}`, details: error },
        { status: 500 }
      );
    }

    console.log('✅ Insert successful:', data);
    return NextResponse.json({ success: true, inserted: leadsToInsert.length, data });

  } catch (err: unknown) {
    console.error('🔥 Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // For GET, the anon key is fine (read only)
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}