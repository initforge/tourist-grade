import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('createApp', () => {
  const app = createApp();

  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
  });

  it('returns api metadata', async () => {
    const response = await request(app).get('/api/v1/meta');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.modules).toContain('auth');
    expect(response.body.modules).toContain('payments');
  });
});
