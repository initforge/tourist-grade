import { describe, expect, it } from 'vitest';
import { normalizePayload, normalizeText } from './text.js';

describe('text normalization', () => {
  it('repairs repeated latin1/utf8 mojibake without changing clean text', () => {
    expect(normalizeText('KhÃƒÂ¡ch HÃƒÂ ng Demo')).toBe('Khách Hàng Demo');
    expect(normalizeText('QuÃ¡ÂºÂ£n lÃƒÂ½ kinh doanh')).toBe('Quản lý kinh doanh');
    expect(normalizeText('Khách hàng')).toBe('Khách hàng');
  });

  it('normalizes nested API payload strings but leaves data URLs intact', () => {
    const payload = normalizePayload({
      user: { name: 'NhÃƒÂ¢n ViÃƒÂªn Kinh Doanh' },
      avatar: 'data:image/svg+xml,%C3%83',
      tags: ['MÃƒÂ¡y bay'],
    });

    expect(payload.user.name).toBe('Nhân Viên Kinh Doanh');
    expect(payload.avatar).toBe('data:image/svg+xml,%C3%83');
    expect(payload.tags[0]).toBe('Máy bay');
  });
});
