import { env } from 'cloudflare:workers';

export interface ServerEnvironment {
  DB: D1Database;
  PHOTOS: R2Bucket;
  SITE_ORIGIN: string;
  SESSION_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Always treated as admin so a fresh database can sign in and add real staff. */
  BOOTSTRAP_ADMIN_EMAIL?: string;
  GOOGLE_MAPS_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  NOTIFICATION_FROM_EMAIL?: string;
  STAFF_NOTIFICATION_EMAIL?: string;
  /** Depot / shop used as default route start and end. */
  DEPOT_LABEL?: string;
  DEPOT_LAT?: string;
  DEPOT_LNG?: string;
}

export function getServerEnvironment(): ServerEnvironment {
  return env as unknown as ServerEnvironment;
}
