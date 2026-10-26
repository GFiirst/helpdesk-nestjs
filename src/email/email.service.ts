import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.getOrThrow<string>('MAIL_USER');
    const pass = this.configService.getOrThrow<string>('MAIL_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('MAIL_HOST'),
        port: this.configService.getOrThrow<number>('MAIL_PORT'),
        secure: this.configService.getOrThrow<boolean>('MAIL_SECURE'),
        auth: { user, pass },
      });
    }
  }

  async sendPasswordReset(recipient: string, resetUrl: string): Promise<void> {
    this.ensureAvailable();

    try {
      await this.transporter!.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_USER'),
        to: recipient,
        subject: 'Reset your Helpdesk password',
        text: `Use this link to reset your password: ${resetUrl}`,
        html: [
          '<p>We received a request to reset your Helpdesk password.</p>',
          `<p><a href="${this.escapeHtml(resetUrl)}">Reset password</a></p>`,
          '<p>If you did not request this change, ignore this email.</p>',
        ].join(''),
      });
    } catch {
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }

  ensureAvailable(): void {
    if (!this.transporter) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
