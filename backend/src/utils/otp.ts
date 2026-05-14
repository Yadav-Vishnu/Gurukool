import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * OTP (One-Time Password) Utility
 *
 * Generates secure 6-digit OTPs and handles hashing/verification.
 * OTPs are never stored in plaintext — always bcrypt hashed.
 */

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt which is safer than Math.random.
 */
export const generateOTP = (): string => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

/**
 * Hash an OTP using bcrypt (cost factor 10).
 * This is stored in the database — even if someone steals the DB,
 * they can't reverse the hash to get the OTP.
 */
export const hashOTP = async (otp: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Verify a user-entered OTP against the stored hash.
 * Returns true if the OTP matches.
 */
export const verifyOTP = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

/**
 * Send OTP via SMS (placeholder — integrate with MSG91/Twilio).
 *
 * In development mode, the OTP is logged to the console.
 * In production, this would call the SMS provider's API.
 */
export const sendOTPViaSMS = async (phone: string, otp: string): Promise<boolean> => {
  // Development mode: just log it
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📱 ===== OTP for ${phone}: ${otp} ===== 📱\n`);
    return true;
  }

  // Production: integrate with SMS provider
  // TODO: Implement MSG91/Twilio integration in Phase 1 completion
  try {
    // Example MSG91 integration:
    // const response = await fetch('https://api.msg91.com/api/v5/otp', {
    //   method: 'POST',
    //   headers: {
    //     'authkey': env.SMS_API_KEY,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     template_id: env.SMS_TEMPLATE_ID,
    //     mobile: `91${phone}`,
    //     otp: otp,
    //   }),
    // });

    console.log(`📱 OTP sent to ${phone}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send OTP to ${phone}:`, error.message);
    return false;
  }
};
