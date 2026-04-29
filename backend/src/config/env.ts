import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  PAYOS_CHECKSUM_KEY: z.string().optional(),
  PAYOS_RETURN_URL: z.string().default('http://localhost:8080/booking/success'),
  PAYOS_CANCEL_URL: z.string().default('http://localhost:8080/booking/lookup'),
  PAYOS_WEBHOOK_URL: z.string().optional(),
  EMAILJS_ENABLED: z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean()).default(false),
  EMAILJS_SERVICE_ID: z.string().optional(),
  EMAILJS_TEMPLATE_ID: z.string().optional(),
  EMAILJS_PUBLIC_KEY: z.string().optional(),
  EMAILJS_PRIVATE_KEY: z.string().optional(),
  EMAILJS_FROM_NAME: z.string().default('Travela'),
  EMAILJS_REPLY_TO: z.string().email().default('booking@travela.vn'),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parsedEnv.CORS_ORIGIN.split(',')
    .map((item) => item.trim())
    .filter(Boolean),
};
