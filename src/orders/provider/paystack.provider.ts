import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import axios from 'axios';

export interface IInitialize {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface IVerify {
  status: string;
  reference: string;
  amount: number;
  gateway_response: string;
}

export interface ITrx<T> {
  status: boolean;
  data: T;
}

@Injectable()
export class PaystackService {
  private PAYSTACK_SECRET_KEY: string;

  constructor(private readonly configService: ConfigService) {
    this.PAYSTACK_SECRET_KEY = this.configService.get<string>(
      'PAYSTACK_SECRET_KEY',
    );
  }

  /**
   * Initialize a transaction
   * @param data
   * @see https://paystack.com/docs/api/transaction/#initialize
   */
  async intializeTransaction(data: {
    email: string;
    amount: number;
  }): Promise<ITrx<IInitialize>> {
    try {
      const payload = {
        email: data.email,
        amount: data.amount * 100,
      };

      const response = await axios({
        url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/initialize`,
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(error.response.data.message);
    }
  }

  /**
   * Verify a transaction
   * @see https://paystack.com/docs/api/transaction/#verify
   */
  async verifyTransaction(reference: string): Promise<ITrx<IVerify>> {
    try {
      const response = await axios({
        url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        },
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error:', error);
      throw new InternalServerErrorException(error.response.data.message);
    }
  }

  async handleResponse(response: any) {
    try {
      const jsonResponse = await response.data;

      return {
        ...jsonResponse,
        httpStatusCode: response.status,
      };
    } catch (err) {
      console.log(err);
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }
  }
}
