import { Request, Response } from 'express';
import { db } from '../db';
import { otpVerifications } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

// Generate 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export class OtpController {
  /**
   * Send OTP to email
   * POST /auth/otp/send
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, type = 'email' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Generate OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Delete any existing OTPs for this email
      await db.delete(otpVerifications)
        .where(and(
          eq(otpVerifications.email, email.toLowerCase()),
          eq(otpVerifications.type, type)
        ));

      // Create new OTP record
      const [otp] = await db.insert(otpVerifications)
        .values({
          email: email.toLowerCase(),
          code,
          type,
          expiresAt,
        })
        .returning();

      // Send email with OTP
      if (type === 'email') {
        const sent = await emailService.sendVerificationCode(email, code);
        if (!sent) {
          // If email fails but SENDGRID_API_KEY is not set, still return success for development
          if (!process.env.SENDGRID_API_KEY) {
            console.log(`📧 [DEV MODE] OTP for ${email}: ${code}`);
          } else {
            res.status(500).json({ error: 'Failed to send verification email' });
            return;
          }
        }
      } else if (type === 'sms') {
        // SMS verification is still a mock for now
        console.log(`📱 [MOCK SMS] OTP for ${email}: ${code}`);
      }

      res.json({
        otp_id: otp.id,
        expires_at: otp.expiresAt.toISOString(),
        message: type === 'email' 
          ? 'Verifizierungscode wurde an Ihre E-Mail gesendet'
          : 'Verifizierungscode wurde per SMS gesendet',
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Verify OTP
   * POST /auth/otp/verify
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { otp_id, code, email } = req.body;

      if (!code || (!otp_id && !email)) {
        res.status(400).json({ error: 'Code and either otp_id or email are required' });
        return;
      }

      // Find OTP record
      let otpRecord;
      
      if (otp_id) {
        otpRecord = await db.query.otpVerifications.findFirst({
          where: and(
            eq(otpVerifications.id, otp_id),
            eq(otpVerifications.verified, false),
            gt(otpVerifications.expiresAt, new Date())
          ),
        });
      } else {
        otpRecord = await db.query.otpVerifications.findFirst({
          where: and(
            eq(otpVerifications.email, email.toLowerCase()),
            eq(otpVerifications.verified, false),
            gt(otpVerifications.expiresAt, new Date())
          ),
        });
      }

      if (!otpRecord) {
        res.status(400).json({ 
          error: 'OTP not found or expired',
          message: 'Der Code ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Code an.'
        });
        return;
      }

      // Check attempts (max 5)
      if (otpRecord.attempts >= 5) {
        res.status(429).json({ 
          error: 'Too many attempts',
          message: 'Zu viele Versuche. Bitte fordern Sie einen neuen Code an.'
        });
        return;
      }

      // Increment attempts
      await db.update(otpVerifications)
        .set({ attempts: otpRecord.attempts + 1 } as any)
        .where(eq(otpVerifications.id, otpRecord.id));

      // Verify code
      if (otpRecord.code !== code) {
        const remainingAttempts = 5 - (otpRecord.attempts + 1);
        res.status(400).json({ 
          error: 'Invalid code',
          message: `Ungültiger Code. ${remainingAttempts} Versuche verbleibend.`,
          remaining_attempts: remainingAttempts
        });
        return;
      }

      // Mark as verified
      await db.update(otpVerifications)
        .set({ verified: true } as any)
        .where(eq(otpVerifications.id, otpRecord.id));

      res.json({
        success: true,
        message: 'E-Mail erfolgreich verifiziert',
        email: otpRecord.email,
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Resend OTP
   * POST /auth/otp/resend
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, type = 'email' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Check if there's a recent OTP (rate limiting - 60 seconds)
      const recentOtp = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.email, email.toLowerCase()),
          eq(otpVerifications.type, type),
          gt(otpVerifications.createdAt, new Date(Date.now() - 60 * 1000))
        ),
      });

      if (recentOtp) {
        const waitTime = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
        res.status(429).json({ 
          error: 'Rate limited',
          message: `Bitte warten Sie ${waitTime} Sekunden, bevor Sie einen neuen Code anfordern.`,
          wait_seconds: waitTime
        });
        return;
      }

      // Forward to sendOtp
      await this.sendOtp(req, res);
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const otpController = new OtpController();
