// lib/db.ts
import { join } from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Define all data shapes
export type User = {
  id: string;
  email: string;
  password: string; // plain text for demo – upgrade to hashed later
};

export type Lead = {
  id: string;
  address: string | null;
  price: number | null;
  owner_name: string | null;
  phone: string | null;
  days_on_market: number | null;
  motivation_score: number | null;
  status: string; // 'new', 'accepted', 'rejected', 'closed'
  created_at: string;
};

export type SuccessFee = {
  id: string;
  lead_id: string;
  amount: number;
  paid: boolean;
  due_date: string | null;
};

type Data = {
  users: User[];
  leads: Lead[];
  success_fees: SuccessFee[];
};

// Default empty data
const defaultData: Data = {
  users: [],
  leads: [],
  success_fees: [],
};

// Path to JSON file – saved in project root
const file = join(process.cwd(), 'data.json');
const adapter = new JSONFile<Data>(file);
const db = new Low(adapter, defaultData);

// Initialize database (read from disk or create)
export async function initDb() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

// Call init on import
initDb();

export { db };