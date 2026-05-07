import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { sql } from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const users = await sql`
            SELECT id, email, password FROM users WHERE email = ${credentials.email}
          `;
          console.log('Query result:', users);
          const user = users[0];
          if (user && user.password === credentials.password) {
            return { id: user.id, email: user.email };
          }
        } catch (err) {
          console.error('Auth DB error:', err);
          return null;
        }

        // Fallback hardcoded (in case table missing)
        if (credentials.email === 'wife@agency.com' && credentials.password === 'test123') {
          console.log('Using hardcoded fallback');
          return { id: '1', email: 'wife@agency.com' };
        }
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
  secret: process.env.NEXTAUTH_SECRET, // explicitly set
});

export { handler as GET, handler as POST };