import PayOS from '@payos/node';
import { env } from '../config/env.js';

let client: PayOS | null = null;

export function getPayOSClient() {
  if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) {
    return null;
  }

  if (!client) {
    client = new PayOS(env.PAYOS_CLIENT_ID, env.PAYOS_API_KEY, env.PAYOS_CHECKSUM_KEY);
  }

  return client;
}
