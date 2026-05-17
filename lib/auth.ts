import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'read:user user:email repo' },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'github') return false

      const gh = profile as { id: number; login: string }

      try {
        const { error } = await supabaseAdmin.from('users').upsert(
          {
            github_id: String(gh.id),
            github_login: gh.login,
            email: user.email ?? null,
          },
          { onConflict: 'github_id' }
        )
        if (error) console.error('signIn upsert error:', error)
      } catch (e) {
        console.error('signIn upsert exception:', e)
      }

      return true
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token as string
        const gh = profile as { id: number; login: string }
        token.githubId = String(gh.id)
        token.githubLogin = gh.login
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.githubId = token.githubId
      session.user.githubLogin = token.githubLogin
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: { strategy: 'jwt' },
}
