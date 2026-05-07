import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

// Admin client for reading/writing users (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // ✅ Guard against undefined credentials
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          return null;
        }

        console.log(`Auth attempt for email: ${credentials.email}`);
        
        try {
          const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, email, password')
            .eq('email', credentials.email);

          if (error) {
            console.error('Supabase query error:', error);
            return null;
          }
          
          if (!users || users.length === 0) {
            console.log(`No user found for email: ${credentials.email}`);
            return null;
          }

          const user = users[0];
          console.log(`User found: ${user.email}, password in DB: ${user.password}`);
          console.log(`Provided password: ${credentials.password}`);
          console.log(`Passwords match: ${user.password === credentials.password}`);

          if (user.password === credentials.password) {
            console.log('Authentication successful!');
            return { id: user.id, email: user.email };
          }
        } catch (err) {
          console.error('Unexpected error in authorizer:', err);
          return null;
        }
        
        console.log('Authentication failed.');
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };