import { Test, TestingModule } from '@nestjs/testing';
import { NibssService } from './nibss.service';

describe('NibssService', () => {
  let service: NibssService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NibssService],
    }).compile();
    service = module.get<NibssService>(NibssService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── verifyNin ─────────────────────────────────────────────────────
  describe('verifyNin()', () => {
    it('returns verified=true for valid 11-digit NIN with name', async () => {
      const result = await service.verifyNin('12345678901', 'John Doe');
      expect(result.verified).toBe(true);
      expect(result.type).toBe('nin');
      expect(result.name).toBe('John Doe');
      expect(result.number).toBe('12345678901');
    });

    it('returns verified=false when NIN has fewer than 11 digits', async () => {
      const result = await service.verifyNin('123456', 'John Doe');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/11 digits/i);
    });

    it('returns verified=false when NIN has more than 11 digits', async () => {
      const result = await service.verifyNin('123456789012', 'John Doe');
      expect(result.verified).toBe(false);
    });

    it('strips non-digit characters before validating', async () => {
      const result = await service.verifyNin('1234 5678 901', 'Jane Doe');
      expect(result.verified).toBe(true);
      expect(result.number).toBe('12345678901');
    });

    it('returns verified=false when expectedName is empty', async () => {
      const result = await service.verifyNin('12345678901', '');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/name is required/i);
    });

    it('returns verified=false when expectedName is too short (< 2 chars)', async () => {
      const result = await service.verifyNin('12345678901', 'J');
      expect(result.verified).toBe(false);
    });

    it('result always includes verifiedAt timestamp', async () => {
      const result = await service.verifyNin('12345678901', 'John Doe');
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });
  });

  // ── verifyBvn ─────────────────────────────────────────────────────
  describe('verifyBvn()', () => {
    it('returns verified=true for valid 11-digit BVN with name', async () => {
      const result = await service.verifyBvn('22345678901', 'Jane Doe');
      expect(result.verified).toBe(true);
      expect(result.type).toBe('bvn');
      expect(result.name).toBe('Jane Doe');
      expect(result.number).toBe('22345678901');
    });

    it('returns verified=false for BVN shorter than 11 digits', async () => {
      const result = await service.verifyBvn('2234567', 'Jane Doe');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/11 digits/i);
    });

    it('strips non-digit characters from BVN before validation', async () => {
      const result = await service.verifyBvn('2234-5678-901', 'Jane Doe');
      expect(result.verified).toBe(true);
      expect(result.number).toBe('22345678901');
    });

    it('returns verified=false when name is empty', async () => {
      const result = await service.verifyBvn('22345678901', '');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/name is required/i);
    });

    it('trims whitespace from expected name', async () => {
      const result = await service.verifyBvn('22345678901', '  Jane Doe  ');
      expect(result.name).toBe('Jane Doe');
    });
  });

  // ── verifyCac ─────────────────────────────────────────────────────
  describe('verifyCac()', () => {
    it('returns verified=true for valid CAC number and company name', async () => {
      const result = await service.verifyCac('RC123456', 'Prodigy Holdings Ltd');
      expect(result.verified).toBe(true);
      expect(result.type).toBe('cac');
      expect(result.name).toBe('Prodigy Holdings Ltd');
      expect(result.number).toBe('RC123456');
    });

    it('returns verified=false when CAC number is too short', async () => {
      const result = await service.verifyCac('RC12', 'Prodigy Ltd');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/too short/i);
    });

    it('returns verified=false when company name is missing', async () => {
      const result = await service.verifyCac('RC123456', '');
      expect(result.verified).toBe(false);
      expect(result.message).toMatch(/name is required/i);
    });

    it('returns verified=false when company name is too short (< 2 chars)', async () => {
      const result = await service.verifyCac('RC123456', 'A');
      expect(result.verified).toBe(false);
    });

    it('trims whitespace from company name', async () => {
      const result = await service.verifyCac('RC123456', '  Sunshine Ventures Ltd  ');
      expect(result.name).toBe('Sunshine Ventures Ltd');
    });

    it('accepts alphanumeric CAC numbers (e.g. BN prefix)', async () => {
      const result = await service.verifyCac('BN-123456', 'Tech Solutions');
      expect(result.verified).toBe(true);
    });

    it('result always includes verifiedAt timestamp', async () => {
      const result = await service.verifyCac('RC123456', 'Prodigy Holdings Ltd');
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });
  });

  // ── cross-cutting ──────────────────────────────────────────────────
  describe('response shape', () => {
    it('every result includes number, type, message, verifiedAt', async () => {
      const results = await Promise.all([
        service.verifyNin('12345678901', 'Test User'),
        service.verifyBvn('22345678901', 'Test User'),
        service.verifyCac('RC123456', 'Test Corp Ltd'),
      ]);
      for (const r of results) {
        expect(r).toHaveProperty('number');
        expect(r).toHaveProperty('type');
        expect(r).toHaveProperty('message');
        expect(r).toHaveProperty('verifiedAt');
      }
    });

    it('failed verifications return verified=false without leaking name', async () => {
      const r = await service.verifyNin('123', 'John Doe');
      expect(r.verified).toBe(false);
      expect(r.name).toBeUndefined();
    });
  });
});
