import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderItems } from 'src/orders/entities/order-items.entity';

import { User, UserCredentials } from './user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Confirm your email address!`,
      template: './email-verification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        url,
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        year: new Date().getFullYear(),
      },
    });
  }

  async sendUserConfirmationWithCredentials(
    user: UserCredentials,
    token: string,
  ) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Welcome to ${this.configService.get(
        'APP_NAME',
      )}! Confirm your Email`,
      template: './email-verification-with-credentials', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        url,
        email: user.email,
        password: user.password,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendResetPasswordReset(user: User, token: string) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/reset?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Reset your password`,
      template: './password-reset', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        url,
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        year: new Date().getFullYear(),
      },
    });
  }

  async sendContactMessage(data: {
    name: string;
    email: string;
    message: string;
  }) {
    const url = `mailto:${data.email}`;

    await this.mailerService.sendMail({
      to: this.configService.get<string>('CONTACT_EMAIL'),
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Contact message from ${data.name}`,
      template: './contact-message', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: data.name,
        email: data.email,
        message: data.message,
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        url,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send course order email
   * @param user
   * @param data
   */
  async sendCourseOrderEmail(
    user: { firstName: string; lastName: string; email: string },
    data: {
      trxDate: string;
      trxNo: string;
      subAmount: string;
      amount: string;
      taxRate: string;
      total: string;
      gateway: string;
      items: OrderItems[];
    },
  ) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/login?redir_url=/user`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Order complete! Start learning now.`,
      template: './course-order-notification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        app: this.configService.get<string>('APP_NAME'),
        address: this.configService.get<string>('COMPANY_ADDRESS'),
        items: data.items,
        trxDate: data.trxDate,
        trxNo: data.trxNo,
        subAmount: data.subAmount,
        amount: data.amount,
        taxRate: data.taxRate,
        total: data.total,
        gateway: data.gateway,
        url,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send order cancellation email
   * @param user
   * @param data
   */
  async sendOrderCancellationEmail(
    user: { firstName: string; lastName: string; email: string },
    data: {
      trxDate: string;
      trxNo: string;
      subAmount: string;
      amount: string;
      taxRate: string;
      total: string;
      gateway: string;
      items: OrderItems[];
    },
  ) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/login?redir_url=/user`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Your order has been cancelled`,
      template: './order-cancellation', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        app: this.configService.get<string>('APP_NAME'),
        address: this.configService.get<string>('COMPANY_ADDRESS'),
        items: data.items,
        trxDate: data.trxDate,
        trxNo: data.trxNo,
        subAmount: data.subAmount,
        amount: data.amount,
        taxRate: data.taxRate,
        total: data.total,
        gateway: data.gateway,
        url,
        year: new Date().getFullYear(),
      },
    });
  }
}
