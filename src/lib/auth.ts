import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Two independent passcode gates, built on the same mechanism:
// - the "edit" gate (APP_PASSCODE) — shared by the whole team, guards
//   add/edit/delete actions.
// - the "feedback" gate (FEEDBACK_PASSCODE) — known only to whoever reads
//   submissions, guards the /feedback inbox. Deliberately NOT the same
//   secret as the edit passcode: anyone who can edit content should not
//   automatically be able to read what people said about the site.
//
// Neither gate is a real auth system — no accounts, just a secret. Each
// cookie doesn't store the passcode itself; it stores an HMAC signed with
// that gate's passcode as the key, so someone can't just set their own
// cookie value to "true" and skip the check, and the passcode is never
// re-sent to the browser on later requests.

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — "remembered for that browser session" and beyond
const TOKEN_MESSAGE = "unlocked";

function createGate(cookieName: string, envVarName: string) {
  function getPasscode(): string {
    const passcode = process.env[envVarName];
    if (!passcode) {
      throw new Error(
        `Missing ${envVarName}. Set it in .env.local (and in Vercel's environment variables).`
      );
    }
    return passcode;
  }

  function sign(): string {
    return createHmac("sha256", getPasscode()).update(TOKEN_MESSAGE).digest("hex");
  }

  async function isUnlocked(): Promise<boolean> {
    const store = await cookies();
    const token = store.get(cookieName)?.value;
    if (!token) return false;

    const expected = sign();
    const a = Buffer.from(token, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  function checkPasscode(input: string): boolean {
    const expected = getPasscode();
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  async function setUnlockedCookie(): Promise<void> {
    const store = await cookies();
    store.set(cookieName, sign(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE_SECONDS,
      path: "/",
    });
  }

  async function clearUnlockedCookie(): Promise<void> {
    const store = await cookies();
    store.delete(cookieName);
  }

  return { isUnlocked, checkPasscode, setUnlockedCookie, clearUnlockedCookie };
}

const editGate = createGate("finance_hub_session", "APP_PASSCODE");
const feedbackGate = createGate("finance_hub_feedback_session", "FEEDBACK_PASSCODE");

export const isUnlocked = editGate.isUnlocked;
export const checkPasscode = editGate.checkPasscode;
export const setUnlockedCookie = editGate.setUnlockedCookie;
export const clearUnlockedCookie = editGate.clearUnlockedCookie;

/** Throws if the write-passcode hasn't been entered. Call this at the top
 * of every Server Action that mutates data — render-time gating (only
 * showing the "Add process" button when unlocked) is not itself a security
 * boundary, since the action is still a reachable POST endpoint. */
export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) {
    throw new Error("Locked: enter the passcode before making changes.");
  }
}

export const isFeedbackUnlocked = feedbackGate.isUnlocked;
export const checkFeedbackPasscode = feedbackGate.checkPasscode;
export const setFeedbackUnlockedCookie = feedbackGate.setUnlockedCookie;
export const clearFeedbackUnlockedCookie = feedbackGate.clearUnlockedCookie;
