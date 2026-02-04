import NextAuth from "next-auth";
import { authOptions } from "./auth-options";

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      employeeId: string | null;
    };
  }

  interface User {
    role: string;
    employeeId: string | null;
  }
}
