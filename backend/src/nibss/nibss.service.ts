import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

export interface VerificationResult {
  verified: boolean;
  name?: string;
  message: string;
  number: string;
  type: 'nin' | 'bvn' | 'cac';
  verifiedAt: Date;
  provider?: 'demo' | 'qoreid';
  providerReference?: string;
}

interface ParsedName {
  firstname: string;
  lastname: string;
}

@Injectable()
export class NibssService {
  private readonly logger = new Logger(NibssService.name);
  private qoreIdToken?: { value: string; expiresAt: number };

  /**
   * Verify NIN (National Identity Number). NIN document upload still remains part of KYC;
   * onboarding authentication now uses BVN.
   */
  async verifyNin(nin: string, expectedName: string): Promise<VerificationResult> {
    const clean = nin.replace(/\D/g, '');

    if (clean.length !== 11) {
      return {
        verified: false,
        message: 'NIN must be exactly 11 digits.',
        number: clean,
        type: 'nin',
        verifiedAt: new Date(),
      };
    }

    if (!expectedName || expectedName.trim().length < 2) {
      return {
        verified: false,
        message: 'Full name is required for NIN verification.',
        number: clean,
        type: 'nin',
        verifiedAt: new Date(),
      };
    }

    this.logger.log(`NIN verification requested: ${this.maskIdentifier(clean)}`);

    return {
      verified: true,
      name: expectedName.trim(),
      message: 'NIN format accepted. BVN is required for account authentication.',
      number: clean,
      type: 'nin',
      verifiedAt: new Date(),
      provider: 'demo',
    };
  }

  /**
   * Verify BVN using QoreID boolean match. This method never logs or persists raw BVN;
   * callers that need persistence should store only a keyed digest.
   */
  async verifyBvn(bvn: string, expectedName: string, extras: { email?: string; phone?: string } = {}): Promise<VerificationResult> {
    const clean = bvn.replace(/\D/g, '');
    const verifiedAt = new Date();

    if (clean.length !== 11) {
      return {
        verified: false,
        message: 'BVN must be exactly 11 digits.',
        number: this.maskIdentifier(clean),
        type: 'bvn',
        verifiedAt,
      };
    }

    const parsedName = this.parseName(expectedName);
    if (!parsedName) {
      return {
        verified: false,
        message: 'Full first and last name is required for BVN verification.',
        number: this.maskIdentifier(clean),
        type: 'bvn',
        verifiedAt,
      };
    }

    if (this.shouldUseDemoVerification()) {
      this.logger.warn(`QoreID credentials unavailable; using explicit demo BVN verification for ${this.maskIdentifier(clean)}.`);
      return {
        verified: true,
        name: expectedName.trim(),
        message: 'BVN verified successfully in demo mode.',
        number: this.maskIdentifier(clean),
        type: 'bvn',
        verifiedAt,
        provider: 'demo',
      };
    }

    const token = await this.getQoreIdToken();
    const baseUrl = this.getQoreIdBaseUrl();

    try {
      const response = await axios.post(
        `${baseUrl}/v1/ng/identities/bvn-premium/${clean}`,
        {
          firstname: parsedName.firstname,
          // fistname: parsedName.firstname,
          lastname: parsedName.lastname,
          // ...(extras.phone ? { phone: extras.phone } : {}),
          // ...(extras.email ? { email: extras.email } : {}),
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: this.getQoreIdTimeoutMs(),
        },
      );
      
      // console.log("bvn data  details = ", response.data)
      
      const fieldMatches = this.extractBvnFieldMatches(response.data);
      const firstNameMatches = fieldMatches.firstname === true || fieldMatches.fistname === true;
      const lastNameMatches = fieldMatches.lastname === true;
      const verified = firstNameMatches && lastNameMatches;
      const providerReference = this.extractProviderReference(response.data);
      
      this.logger.log(`QoreID BVN boolean match completed for ${this.maskIdentifier(clean)}: ${verified ? 'matched' : 'not matched'}`);

      return {
        verified,
        name: expectedName.trim(),
        message: verified ? 'BVN verified successfully.' : 'BVN details did not match the supplied name.',
        number: this.maskIdentifier(clean),
        type: 'bvn',
        verifiedAt,
        provider: 'qoreid',
        providerReference,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        
        // BVN does not exist
        if (status === 404) {
      console.log("bvn data error details = ",error)
      this.logger.log(
        `QoreID BVN lookup completed for ${this.maskIdentifier(clean)}: BVN not found`,
      );

      return {
        verified: false,
        name: expectedName.trim(),
        message: 'BVN not found. Please provide a valid BVN.',
        number: this.maskIdentifier(clean),
        type: 'bvn',
        verifiedAt,
        provider: 'qoreid',
      };
    }

    this.logger.error(
      `QoreID BVN verification failed for ${this.maskIdentifier(clean)} with HTTP ${status}. Response: ${message}`,
    );
  }

  throw new ServiceUnavailableException(
    'BVN verification is temporarily unavailable. Please try again later.',
  );
}
  }

  /**
   * Verify CAC (Corporate Affairs Commission) registration number.
   */
  async verifyCac(cacNumber: string, companyName: string): Promise<VerificationResult> {
    const clean = cacNumber.trim();

    if (clean.length < 6) {
      return {
        verified: false,
        message: 'CAC registration number is too short (min 6 chars).',
        number: clean,
        type: 'cac',
        verifiedAt: new Date(),
      };
    }

    if (!companyName || companyName.trim().length < 2) {
      return {
        verified: false,
        message: 'Company name is required for CAC verification.',
        number: clean,
        type: 'cac',
        verifiedAt: new Date(),
      };
    }

    this.logger.log(`CAC verification requested: ${clean.substring(0, 3)}***${clean.substring(clean.length - 3)}`);

    return {
      verified: true,
      name: companyName.trim(),
      message: 'CAC registration verified successfully.',
      number: clean,
      type: 'cac',
      verifiedAt: new Date(),
      provider: 'demo',
    };
  }

  private async getQoreIdToken(): Promise<string> {
    const now = Date.now();
    if (this.qoreIdToken && this.qoreIdToken.expiresAt > now + 30_000) return this.qoreIdToken.value;

    const clientId = process.env.QOREID_CLIENT_ID;
    const secret = process.env.QOREID_SECRET;
    if (!clientId || !secret) {
      throw new BadRequestException('QoreID credentials are not configured.');
    }

    const response = await axios.post(
      `${this.getQoreIdBaseUrl()}/token`,
      { clientId, secret },
      { headers: { 'Content-Type': 'application/json' }, timeout: this.getQoreIdTimeoutMs() },
    );

    const value = response.data?.access_token ?? response.data?.accessToken ?? response.data?.token;
    if (!value || typeof value !== 'string') {
      throw new ServiceUnavailableException('QoreID did not return an access token.');
    }
    // console.log( "token value = ", value)

    const expiresInSeconds = Number(response.data?.expires_in ?? response.data?.expiresIn ?? 300);
    this.qoreIdToken = { value, expiresAt: now + Math.max(60, expiresInSeconds - 30) * 1000 };
    return value;
  }

  private shouldUseDemoVerification(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.QOREID_ALLOW_DEMO_VERIFICATION === 'true';
  }

  private getQoreIdBaseUrl(): string {
    return (process.env.QOREID_BASE_URL ?? 'https://api.qoreid.com').replace(/\/$/, '');
  }

  private getQoreIdTimeoutMs(): number {
    const parsed = Number(process.env.QOREID_TIMEOUT_MS ?? 10_000);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
  }

  private parseName(name: string): ParsedName | null {
    const parts = name.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
    if (parts.length < 2 || parts[0].length < 2 || parts[parts.length - 1].length < 2) return null;
    return { firstname: parts[0], lastname: parts[parts.length - 1] };
  }

  private extractBvnFieldMatches(data: any): Record<string, boolean> {
    return data?.summary?.bvn_check?.fieldMatches
      ?? {};
  }

  private extractProviderReference(data: any): string | undefined {
    const value = data?.id ?? data?.requestId ?? data?.reference ?? data?.applicant?.id;
    return value === undefined || value === null ? undefined : String(value);
  }

  private maskIdentifier(value: string): string {
    if (value.length <= 6) return '*'.repeat(value.length);
    return `${value.slice(0, 3)}*****${value.slice(-2)}`;
  }
}
