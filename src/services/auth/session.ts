import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE = 'booker_session';
export const SESSION_HOURS = 8;

const encoder = new TextEncoder();
const key = (secret: string) => encoder.encode(secret);

export async function createSessionToken(email: string, secret: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key(secret));
}

/** The signed-in email, or null for a missing, forged or expired token. */
export async function readSessionToken(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}
