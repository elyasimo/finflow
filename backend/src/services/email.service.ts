import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email Service using Nodemailer
 * 
 * Primary: Microsoft 365 SMTP (noreply@finflowapp.ch)
 * Fallback: Gmail SMTP (500 emails/day free)
 * 
 * Uses lazy initialization to ensure environment variables are loaded
 */

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string = '';
  private fromName: string = 'FinFlow';
  private provider: 'microsoft' | 'gmail' | 'none' = 'none';
  private initialized: boolean = false;

  /**
   * Initialize the email service - called after dotenv.config()
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.fromName = process.env.SMTP_FROM_NAME || process.env.GMAIL_FROM_NAME || 'FinFlow';
    this.initTransporter();
  }

  private initTransporter(): void {
    // Try Microsoft 365 first (primary)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    console.log('📧 Initializing Email Service...');
    console.log('   SMTP_HOST:', smtpHost || '(not set)');
    console.log('   SMTP_USER:', smtpUser || '(not set)');
    console.log('   SMTP_PASSWORD:', smtpPassword ? '***' : '(not set)');

    if (smtpHost && smtpUser && smtpPassword) {
      this.fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
      this.fromName = process.env.SMTP_FROM_NAME || 'FinFlow';
      
      console.log('📧 Attempting Microsoft 365 SMTP connection...');
      console.log('   Host:', smtpHost);
      console.log('   Port:', smtpPort || '587');
      console.log('   Auth User:', smtpUser);
      console.log('   From:', this.fromEmail);
      
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: false, // Use STARTTLS for port 587
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Microsoft 365 SMTP connection failed:', error.message);
          console.error('   Error details:', JSON.stringify(error, null, 2));
          console.log('🔄 Trying Gmail fallback...');
          this.initGmailFallback();
        } else {
          this.provider = 'microsoft';
          console.log('✅ Microsoft 365 SMTP connected successfully!');
          console.log('   Sending from:', `"${this.fromName}" <${this.fromEmail}>`);
        }
      });
      return;
    }

    // Fallback to Gmail
    this.initGmailFallback();
  }

  private initGmailFallback(): void {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    console.log('   GMAIL_USER:', gmailUser || '(not set)');
    console.log('   GMAIL_APP_PASSWORD:', gmailPassword ? '***' : '(not set)');

    if (!gmailUser || !gmailPassword) {
      console.warn('⚠️ No email credentials configured - emails will not be sent');
      console.warn('   Set SMTP_* or GMAIL_* variables in .env');
      return;
    }

    this.fromEmail = gmailUser;
    this.fromName = process.env.GMAIL_FROM_NAME || 'FinFlow';

    console.log('📧 Attempting Gmail SMTP connection...');
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Gmail SMTP connection failed:', error.message);
        this.transporter = null;
      } else {
        this.provider = 'gmail';
        console.log('✅ Gmail SMTP connected (fallback)');
        console.log('   Sending from:', `"${this.fromName}" <${this.fromEmail}>`);
      }
    });
  }

  /**
   * Ensure service is initialized before sending
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.init();
    }
  }

  /**
   * Send an email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    this.ensureInitialized();
    
    if (!this.transporter) {
      console.warn('⚠️ Email transporter not configured - skipping email to:', to);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });

      console.log(`✅ Email sent to ${to} via ${this.provider}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }

  /**
   * Send 6-digit verification code email
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifizierungscode</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
            -webkit-font-smoothing: antialiased;
          }
          .container { 
            max-width: 480px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .card { 
            background: white; 
            border-radius: 24px; 
            padding: 40px; 
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 32px; 
          }
          .logo-text { 
            font-size: 32px; 
            font-weight: 700; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          h1 { 
            color: #1e293b; 
            font-size: 24px; 
            font-weight: 600;
            margin: 0 0 12px; 
            text-align: center; 
          }
          p { 
            color: #64748b; 
            font-size: 16px; 
            line-height: 1.6; 
            margin: 0 0 24px; 
            text-align: center; 
          }
          .code-box { 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            border-radius: 16px; 
            padding: 28px; 
            text-align: center; 
            margin: 32px 0; 
          }
          .code { 
            font-size: 40px; 
            font-weight: 700; 
            letter-spacing: 12px; 
            color: white; 
            font-family: 'SF Mono', Monaco, 'Courier New', monospace; 
          }
          .expires { 
            background: #fef3c7; 
            border-radius: 12px; 
            padding: 14px 18px; 
            margin-top: 24px; 
          }
          .expires p { 
            color: #92400e; 
            font-size: 14px; 
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .footer { 
            text-align: center; 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p { 
            font-size: 13px; 
            color: #94a3b8; 
            margin: 0 0 8px;
          }
          .security-note {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 14px 18px;
            margin-top: 20px;
          }
          .security-note p {
            color: #475569;
            font-size: 13px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <span class="logo-text">FinFlow</span>
            </div>
            <h1>Ihr Verifizierungscode</h1>
            <p>Geben Sie diesen Code ein, um Ihre E-Mail-Adresse zu bestätigen:</p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <div class="expires">
              <p>⏱️ Dieser Code ist <strong>5 Minuten</strong> gültig.</p>
            </div>
            <div class="security-note">
              <p>🔒 Teilen Sie diesen Code niemals mit anderen Personen. FinFlow-Mitarbeiter werden Sie niemals nach diesem Code fragen.</p>
            </div>
            <div class="footer">
              <p>Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.</p>
              <p>© ${new Date().getFullYear()} FinFlow - Ihre Finanzen im Griff</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `${code} ist Ihr FinFlow Verifizierungscode`, html);
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei FinFlow</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
          }
          .container { 
            max-width: 480px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .card { 
            background: white; 
            border-radius: 24px; 
            padding: 40px; 
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 32px; 
          }
          .logo-text { 
            font-size: 32px; 
            font-weight: 700; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
          }
          h1 { 
            color: #1e293b; 
            font-size: 24px; 
            margin: 0 0 12px; 
            text-align: center; 
          }
          p { 
            color: #64748b; 
            font-size: 16px; 
            line-height: 1.6; 
            margin: 0 0 20px; 
          }
          .features { 
            background: #f8fafc; 
            border-radius: 16px; 
            padding: 24px; 
            margin: 24px 0; 
          }
          .feature { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            margin-bottom: 16px; 
          }
          .feature:last-child { 
            margin-bottom: 0; 
          }
          .feature-icon { 
            width: 36px; 
            height: 36px; 
            background: linear-gradient(135deg, #dbeafe, #e9d5ff); 
            border-radius: 10px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 18px;
          }
          .feature p { 
            margin: 0; 
            color: #334155; 
            font-size: 15px; 
          }
          .cta { 
            display: block; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            text-align: center; 
            font-weight: 600; 
            margin: 28px 0; 
          }
          .footer { 
            text-align: center; 
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p { 
            font-size: 13px; 
            color: #94a3b8; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <span class="logo-text">FinFlow</span>
            </div>
            <h1>Willkommen, ${name}! 🎉</h1>
            <p style="text-align: center;">Ihr Konto wurde erfolgreich erstellt. Entdecken Sie alle Funktionen:</p>
            <div class="features">
              <div class="feature">
                <div class="feature-icon">📊</div>
                <p>Einnahmen & Ausgaben verfolgen</p>
              </div>
              <div class="feature">
                <div class="feature-icon">💰</div>
                <p>Budgets & Sparziele setzen</p>
              </div>
              <div class="feature">
                <div class="feature-icon">📈</div>
                <p>Detaillierte Finanzanalysen</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🔐</div>
                <p>Sichere Face ID / Touch ID Anmeldung</p>
              </div>
            </div>
            <a href="https://finflowapp.ch/dashboard" class="cta">Zum Dashboard →</a>
            <div class="footer">
              <p>Bei Fragen sind wir für Sie da.</p>
              <p>© ${new Date().getFullYear()} FinFlow - Ihre Finanzen im Griff</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Willkommen bei FinFlow! 🎉', html);
  }

  /**
   * Send password reset code email
   */
  async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
          }
          .container { 
            max-width: 480px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .card { 
            background: white; 
            border-radius: 24px; 
            padding: 40px; 
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 32px; 
          }
          .logo-text { 
            font-size: 32px; 
            font-weight: 700; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
          }
          h1 { 
            color: #1e293b; 
            font-size: 24px; 
            margin: 0 0 12px; 
            text-align: center; 
          }
          p { 
            color: #64748b; 
            font-size: 16px; 
            line-height: 1.6; 
            margin: 0 0 24px; 
            text-align: center; 
          }
          .code-box { 
            background: linear-gradient(135deg, #f59e0b, #ef4444); 
            border-radius: 16px; 
            padding: 28px; 
            text-align: center; 
            margin: 32px 0; 
          }
          .code { 
            font-size: 40px; 
            font-weight: 700; 
            letter-spacing: 12px; 
            color: white; 
            font-family: 'SF Mono', Monaco, 'Courier New', monospace; 
          }
          .expires { 
            background: #fef3c7; 
            border-radius: 12px; 
            padding: 14px 18px; 
            margin-top: 24px; 
          }
          .expires p { 
            color: #92400e; 
            font-size: 14px; 
            margin: 0; 
          }
          .footer { 
            text-align: center; 
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p { 
            font-size: 13px; 
            color: #94a3b8; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <span class="logo-text">FinFlow</span>
            </div>
            <h1>Passwort zurücksetzen</h1>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Hier ist Ihr Code:</p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <div class="expires">
              <p>⏱️ Dieser Code ist <strong>10 Minuten</strong> gültig.</p>
            </div>
            <div class="footer">
              <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
              <p>© ${new Date().getFullYear()} FinFlow - Ihre Finanzen im Griff</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `${code} - Passwort zurücksetzen`, html);
  }
}

export const emailService = new EmailService();
