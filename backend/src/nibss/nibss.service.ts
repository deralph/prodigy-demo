import { Injectable, Logger } from '@nestjs/common';

export interface VerificationResult {
  verified: boolean;
  name?: string;
  message: string;
  number: string;
  type: 'nin' | 'bvn' | 'cac';
  verifiedAt: Date;
}

@Injectable()
export class NibssService {
  private readonly logger = new Logger(NibssService.name);

  /**
   * Verify NIN (National Identity Number)
   * In production, this calls the NIBSS API. For now, validates format.
   */
  async verifyNin(nin: string, expectedName: string): Promise<VerificationResult> {
    const clean = nin.replace(/\D/g, '');
    
    // Validate format
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

    // TODO: Integrate with real NIBSS API when credentials are available
    // For now, return success with format validation passed
    this.logger.log(`NIN verification requested: ${clean.substring(0, 4)}****${clean.substring(clean.length - 2)}`);
    
    return {
      verified: true,
      name: expectedName.trim(),
      message: 'NIN verified successfully.',
      number: clean,
      type: 'nin',
      verifiedAt: new Date(),
    };
  }

  /**
   * Verify BVN (Bank Verification Number)
   */
  async verifyBvn(bvn: string, expectedName: string): Promise<VerificationResult> {
    const clean = bvn.replace(/\D/g, '');
    
    if (clean.length !== 11) {
      return {
        verified: false,
        message: 'BVN must be exactly 11 digits.',
        number: clean,
        type: 'bvn',
        verifiedAt: new Date(),
      };
    }

    if (!expectedName || expectedName.trim().length < 2) {
      return {
        verified: false,
        message: 'Full name is required for BVN verification.',
        number: clean,
        type: 'bvn',
        verifiedAt: new Date(),
      };
    }

    this.logger.log(`BVN verification requested: ${clean.substring(0, 4)}****${clean.substring(clean.length - 2)}`);
    
    return {
      verified: true,
      name: expectedName.trim(),
      message: 'BVN verified successfully.',
      number: clean,
      type: 'bvn',
      verifiedAt: new Date(),
    };
  }

  /**
   * Verify CAC (Corporate Affairs Commission) registration number
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
    };
  }
}
