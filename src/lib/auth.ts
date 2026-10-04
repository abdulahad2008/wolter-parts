import "server-only";
import { eq } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";
import { env } from "./env";
import { bump, forget, hits } from "./rate";
import { admins } from "./schema";

type SessionData = { adminId?: number; v?: number };

export async function getSession() {
  // Read cookies first: this marks the page as per-request, so `next build` never reaches the check below.
  const store = await cookies();
  if (env.sessionSecret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return getIronSession<SessionData>(store, {
    cookieName: "wp_admin",
    password: env.sessionSecret,
    ttl: 60 * 60 * 24 * 30, // 30 days
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: env.cookieSecure, path: "/" },
  });
}

export type CurrentAdmin = { id: number; email: string; name: string; sessionVersion: number };

/**
 * The logged-in admin, or null. Checked against the database on every request, so a removed
 * admin or a changed password (session version bump) logs that person out everywhere.
 */
export const getAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await getSession();
  if (!session.adminId) return null;
  const rows = await getDb()
    .select({ id: admins.id, email: admins.email, name: admins.name, sessionVersion: admins.sessionVersion })
    .from(admins)
    .where(eq(admins.id, session.adminId));
  const admin = rows[0];
  if (!admin || admin.sessionVersion !== (session.v ?? 1)) return null;
  return admin;
});

/** For admin pages: sends visitors who are not logged in to the login page. Call it in every page. */
export async function requireAdminPage(): Promise<CurrentAdmin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/** For server actions and API routes: throws when not logged in. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

// --- Login attempt limit (kept in memory) -------------------------------------------------
// 5 tries per 15 minutes for one IP + email pair, 20 per IP overall. Locking on the pair (not the
// email alone) means a stranger can't lock the real admin out from another address.
const WINDOW_MS = 15 * 60 * 1000;

function keys(ip: string, email: string) {
  return { pair: `login:${ip}|${email}`, ip: `login-ip:${ip}` };
}

/** Counts the attempt before the password check, so parallel requests can't skip the limit. */
export function startLoginAttempt(ip: string, email: string): boolean {
  const k = keys(ip, email);
  if (hits(k.pair, WINDOW_MS) >= 5 || hits(k.ip, WINDOW_MS) >= 20) return false;
  bump(k.pair, WINDOW_MS);
  bump(k.ip, WINDOW_MS);
  return true;
}

export function loginSucceeded(ip: string, email: string) {
  forget(keys(ip, email).pair);
}
