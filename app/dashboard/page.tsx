'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Lead = {
  id: string;
  address: string | null;
  price: number | null;
  motivation_score: number | null;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const { status } = useSession(); // remove unused 'session'
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Define fetchLeads BEFORE useEffect
  async function fetchLeads() {
    try {
      const res = await fetch('/api/ingest-leads');
      const data = await res.json();
      setLeads(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/login');
  } else if (status === 'authenticated') {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }
}, [status, router]);

  async function handleLogout() {
    const { signOut } = await import('next-auth/react');
    signOut({ callbackUrl: '/login' });
  }

  if (loading) {
    return <div className="p-8 text-center">Loading leads...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">LeadFlow AI</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads yet. Run the scraper or insert a test lead.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Price (₽)</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.address || '—'}</TableCell>
                      <TableCell>{lead.price?.toLocaleString() || '—'}</TableCell>
                      <TableCell>{lead.motivation_score ?? '—'}</TableCell>
                      <TableCell className="capitalize">{lead.status}</TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}