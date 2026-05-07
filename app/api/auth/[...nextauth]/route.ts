import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await db.read();
        const user = db.data.users.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return { id: user.id, email: user.email };
        }

        // Hardcoded test account (first run)
        if (credentials.email === 'wife@agency.com' && credentials.password === 'test123') {
          const existing = db.data.users.find((u) => u.email === 'wife@agency.com');
          if (!existing) {
            db.data.users.push({
              id: '1',
              email: 'wife@agency.com',
              password: 'test123',
            });
            await db.write();
          }
          return { id: '1', email: 'wife@agency.com' };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };