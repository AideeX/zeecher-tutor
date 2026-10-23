import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { one, run } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Identity = {
  parent_id: string;
  learner_id: string | null;
  expires_at: number;
};
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function constantEqual(a: string, b: string) {
  return timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
}
export function identity(
  request: NextRequest,
  role: "parent" | "learner" | "any" = "any",
) {
  const names =
    role === "parent"
      ? ["coach_parent"]
      : role === "learner"
        ? ["coach_child"]
        : ["coach_parent", "coach_child"];
  for (const name of names) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    const row = one<Identity>(
      "SELECT parent_id,learner_id,expires_at FROM auth_session WHERE token_hash=? AND expires_at>?",
      digest(token),
      Date.now(),
    );
    if (
      row &&
      (role !== "parent" || row.learner_id === null) &&
      (role !== "learner" || row.learner_id !== null)
    )
      return row;
  }
  throw new HttpError(401, "Please sign in as a parent to continue.");
}
export function issue(
  response: NextResponse,
  parentId: string,
  learnerId: string | null,
) {
  const token = randomBytes(32).toString("hex");
  const seconds = learnerId ? 7200 : 28800;
  run(
    "INSERT INTO auth_session VALUES (?,?,?,?)",
    digest(token),
    parentId,
    learnerId,
    Date.now() + seconds * 1000,
  );
  response.cookies.set(learnerId ? "coach_child" : "coach_parent", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: seconds,
  });
  return response;
}
export function revoke(
  request: NextRequest,
  response: NextResponse,
  name: string,
) {
  const token = request.cookies.get(name)?.value;
  if (token) run("DELETE FROM auth_session WHERE token_hash=?", digest(token));
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0,
  });
}
export function originCheck(request: NextRequest) {
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (!origin || origin !== expected)
    throw new HttpError(403, "The request must come from this application.");
}
export function rateLimit(key: string, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const r = one<{ count: number; reset_at: number }>(
    "SELECT count,reset_at FROM rate_limit WHERE key=?",
    key,
  );
  if (!r || r.reset_at < now) {
    run(
      "INSERT INTO rate_limit VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, reset_at=excluded.reset_at",
      key,
      1,
      now + windowMs,
    );
    return;
  }
  if (r.count >= limit)
    throw new HttpError(429, "Please pause for a moment and try again.");
  run("UPDATE rate_limit SET count=count+1 WHERE key=?", key);
}
