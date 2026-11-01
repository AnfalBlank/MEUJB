/**
 * Auth utility: session token management & password hashing
 * Menggunakan bcryptjs untuk hash password dan crypto untuk session token
 */
import bcrypt from "bcryptjs";
import { client } from "@/db";

const BCRYPT_ROUNDS = 10;

// ─── Password Hashing ───────────────────────────────────────────────────────

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  // Support legacy plaintext passwords (sebelum migrasi bcrypt)
  if (!hash.startsWith("$2")) {
    return plainText === hash;
  }
  return bcrypt.compare(plainText, hash);
}

// ─── Session Token ───────────────────────────────────────────────────────────
// Token disimpan in-memory (Map). Cukup untuk single-process PM2.
// Untuk multi-instance, pindahkan ke Redis atau DB.

interface SessionData {
  userId: string;
  username: string;
  name: string;
  role: string;
  isRoot: boolean;
  createdAt: number;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 jam
const sessions = new Map<string, SessionData>();

export function createSessionToken(data: Omit<SessionData, "createdAt">): string {
  const token =
    "sess_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 18);
  sessions.set(token, { ...data, createdAt: Date.now() });
  return token;
}

export function validateSessionToken(token: string): SessionData | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSessionToken(token: string): void {
  sessions.delete(token);
}

// ─── Request Auth Helper ─────────────────────────────────────────────────────

export function getTokenFromRequest(req: Request): string | null {
  // Header: Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Cookie: session_token=<token>
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function getSessionFromRequest(req: Request): SessionData | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return validateSessionToken(token);
}

// ─── Role Checks ─────────────────────────────────────────────────────────────

export function isSuperAdmin(session: SessionData): boolean {
  return (
    session.isRoot ||
    session.username === "admin" ||
    session.username === "root" ||
    session.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin"
  );
}

export function isAdminOrAbove(session: SessionData): boolean {
  const r = session.role?.toLowerCase().replace(/[\s_-]/g, "");
  return isSuperAdmin(session) || r === "admin";
}
