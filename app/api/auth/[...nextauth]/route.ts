import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { data, error } = await supabase
          .from('users')
          .select('id, email, password')
          .eq('email', credentials.email);
        if (error || !data || data.length === 0) return null;
        const user = data[0];
        if (user.password === credentials.password) return { id: user.id, email: user.email };
        // one‑time test account creation
        if (credentials.email === 'wife@agency.com' && credentials.password === 'test123') {
          await supabase.from('users').upsert({ id: '1', email: 'wife@agency.com', password: 'test123' });
          return { id: '1', email: 'wife@agency.com' };
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) { if (user) token.id = user.id; return token; },
    async session({ session, token }) { if (token && session.user) session.user.id = token.id as string; return session; },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
});
export { handler as GET, handler as POST };