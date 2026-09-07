import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Shared-passcode gate for write actions (add/edit/delete). Not a real
// auth system — there are no accounts, just one secret the whole team
// knows. The cookie doesn't store the passcode itself; it stores an HMAC
// signed with the passcode as the key, so someone can't just set their own
// cookie value to "true" and skip the check, and the passcode is never
// re-sent to the browser on later requests.

const COOKIE_NAME = "finance_hub_session";
const TOKEN_MESSAGE = "unlocked";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — "remembered for that browser session" and beyond

function getPasscode(): string {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    throw new Error(
      "Missing APP_PASSCODE. Set it in .env.local (and in Vercel's environment variables) to the shared passcode trainees will use to add/edit/delete content."
    );
  }
  return passcode;
}

function sign(): string {
  return createHmac("sha256", getPasscode()).update(TOKEN_MESSAGE).digest("hex");
}

export async function isUnlocked(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = sign();
  const a = Buffer.from(token, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Throws if the write-passcode hasn't been entered. Call this at the top
 * of every Server Action that mutates data — render-time gating (only
 * showing the "Add process" button when unlocked) is not itself a security
 * boundary, since the action is still a reachable POST endpoint. */
export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) {
    throw new Error("Locked: enter the passcode before making changes.");
  }
}

export function checkPasscode(input: string): boolean {
  const expected = getPasscode();
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setUnlockedCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearUnlockedCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
