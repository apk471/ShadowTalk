import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // The authorize method is used to check the credentials
      async authorize(credentials: any): Promise<any> {
        // Connect to the database
        await dbConnect();
        try {
          // Find the user by email or username
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });
          // If no user is found, throw an error
          if (!user) {
            throw new Error('No user found with this email');
          }
          // If the user is not verified, throw an error
          if (!user.isVerified) {
            throw new Error('Please verify your account before logging in');
          }
          // Check if the password matches the user's password
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );
          // If the password is correct, return the user
          if (isPasswordCorrect) {
            return user;
          } else {
            // If the password is incorrect, throw an error
            throw new Error('Incorrect password');
          }
        } catch (err: any) {
          // If an error occurred, throw an error
          throw new Error(err);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString(); // Convert ObjectId to string
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
  },
  // Session configuration
  session: {
    strategy: 'jwt',
  },
  // secret 
  secret: process.env.NEXTAUTH_SECRET,
  // changing the path from /api/auth to /sign-in
  pages: {
    signIn: '/sign-in',
  },
};