const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_DATABASE_URL);
sql`SELECT NOW()`.then(console.log).catch(console.error);