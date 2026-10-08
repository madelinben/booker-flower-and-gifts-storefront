import { jwtVerify, SignJWT } from 'jose';

export const LOGIN_COOKIE = 'booker_login';

export interface LoginState {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
}

const encoder = new TextEncoder();

function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function codeChallenge(verifier: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
}

export function newLoginState(next: string): LoginState {
  return { state: randomToken(), nonce: randomToken(), verifier: randomToken(48), next };
}

/** The in-flight login travels in a short-lived signed cookie, so no server storage is needed. */
export async function sealLoginState(login: LoginState, secret: string): Promise<string> {
  return new SignJWT({ ...login }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m').sign(encoder.encode(secret));
}

export async function openLoginState(token: string | undefined, secret: string): Promise<LoginState | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), { algorithms: ['HS256'] });
    const { state, nonce, verifier, next } = payload;
    if ([state, nonce, verifier, next].some((value) => typeof value !== 'string')) return null;
    return { state, nonce, verifier, next } as LoginState;
  } catch {
    return null;
  }
}
