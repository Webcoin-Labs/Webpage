"use server";

import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { z } from "zod";
import { env } from "@/lib/env";
import { dispatchPasswordResetEmail } from "@/lib/notifications/passwordReset";
import { logger } from "@/lib/logger";

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

const registerSchema = z.object({
  email: z.string().email("Invalid email address").transform((s) => s.trim().toLowerCase()),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(USERNAME_REGEX, "Username can only use letters, numbers, underscore and hyphen")
    .transform((s) => s.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().max(100).optional(),
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address").transform((s) => s.trim().toLowerCase()),
});

const resetSchema = z.object({
  token: z.string().min(1, "Invalid reset link"),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type AuthResult = { success: true; devResetLink?: string } | { success: false; error: string };

export async function register(data: {
  email: string;
  username: string;
  password: string;
  name?: string;
}): Promise<AuthResult> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const key = rateLimitKey(normalizedEmail, "register");
  const rl = await rateLimitAsync(key, 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many sign-up attempts. Please try again in a minute." };

  const parsed = registerSchema.safeParse({ ...data, email: normalizedEmail });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const { email, username, password, name } = parsed.data;

  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { username } }),
  ]);
  if (existingEmail) return { success: false, error: "An account with this email already exists." };
  if (existingUsername) return { success: false, error: "This username is already taken." };

  const hashedPassword = await hash(password, 12);
  await db.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name: name ?? email.split("@")[0],
    },
  });
  return { success: true };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = rateLimitKey(normalizedEmail, "forgot-password");
  const rl = await rateLimitAsync(key, 3, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again in a minute." };

  const parsed = forgotSchema.safeParse({ email: normalizedEmail });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  // Always return success to avoid leaking whether email exists
  if (!user?.password) return { success: true };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.verificationToken.deleteMany({
    where: { identifier: parsed.data.email },
  });
  await db.verificationToken.create({
    data: { identifier: parsed.data.email, token, expires },
  });

  const baseUrl = env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/login/reset-password?token=${token}&email=${encodeURIComponent(parsed.data.email)}`;

  const delivery = await dispatchPasswordResetEmail({
    toEmail: parsed.data.email,
    resetLink,
  });
  if (!delivery.delivered) {
    logger.error({
      scope: "auth.requestPasswordReset.delivery",
      message: "Password reset email delivery failed.",
      data: { email: parsed.data.email, provider: delivery.provider, error: delivery.error },
    });
  }

  if (env.NODE_ENV !== "production") {
    return { success: true, devResetLink: resetLink };
  }
  return { success: true };
}

export async function resetPassword(data: {
  token: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const key = rateLimitKey(normalizedEmail, "reset-password");
  const rl = await rateLimitAsync(key, 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many attempts. Please try again later." };

  const parsed = resetSchema.safeParse({ ...data, email: normalizedEmail });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const vt = await db.verificationToken.findFirst({
    where: {
      identifier: parsed.data.email,
      token: parsed.data.token,
      expires: { gt: new Date() },
    },
  });
  if (!vt) return { success: false, error: "Invalid or expired reset link. Please request a new one." };

  const hashedPassword = await hash(parsed.data.password, 12);
  await db.user.update({
    where: { email: parsed.data.email },
    data: { password: hashedPassword },
  });
  await db.verificationToken.deleteMany({
    where: { identifier: parsed.data.email, token: parsed.data.token },
  });
  return { success: true };
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  if (normalized.length < 3 || !USERNAME_REGEX.test(normalized)) return false;
  const existing = await db.user.findUnique({ where: { username: normalized } });
  return !existing;
}
