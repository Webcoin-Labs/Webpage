import { legacyAuthOptions } from "@/lib/auth-legacy";
import NextAuth from "next-auth";

const handler = NextAuth(legacyAuthOptions);
export { handler as GET, handler as POST };
