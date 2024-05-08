import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';

@Injectable()
export class PaypalService {
  private PAYPAL_CLIENT_ID: string;
  private PAYPAL_CLIENT_SECRET: string;

  constructor(private readonly configService: ConfigService) {
    this.PAYPAL_CLIENT_ID = this.configService.get<string>('PAYPAL_CLIENT_ID');
    this.PAYPAL_CLIENT_SECRET = this.configService.get<string>(
      'PAYPAL_CLIENT_SECRET',
    );
  }

  /**
   * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
   * @see https://developer.paypal.com/api/rest/authentication/
   */
  private async generateAccessToken() {
    try {
      if (!this.PAYPAL_CLIENT_ID || !this.PAYPAL_CLIENT_SECRET) {
        throw new Error('MISSING_API_CREDENTIALS');
      }
      const auth = Buffer.from(
        this.PAYPAL_CLIENT_ID + ':' + this.PAYPAL_CLIENT_SECRET,
      ).toString('base64');

      const response = await axios({
        url: `${this.configService.get('PAYPAL_BASE_URL')}/v1/oauth2/token`,
        method: 'POST',
        data: 'grant_type=client_credentials',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const data = await response.data;

      return data.access_token;
    } catch (error) {
      console.error('Failed to generate Access Token:', error);
      throw new InternalServerErrorException(
        'Error with paypal third-party api',
      );
    }
  }

  /**
   * Create an order to start the transaction.
   * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
   */
  async createOrder(total: number) {
    try {
      const accessToken = await this.generateAccessToken();
      const url = `${this.configService.get(
        'PAYPAL_BASE_URL',
      )}/v2/checkout/orders`;
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: `${total}`,
            },
          },
        ],
      };

      const response = await axios(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
          // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: 'POST',
        data: payload,
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Failed to generate Access Token:', error);
      throw new InternalServerErrorException(
        'Error with paypal third-party api',
      );
    }
  }

  /**
   * Capture payment for the created order to complete the transaction.
   * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
   */
  async captureOrder(orderID: string) {
    try {
      const accessToken = await this.generateAccessToken();
      const url = `${this.configService.get(
        'PAYPAL_BASE_URL',
      )}/v2/checkout/orders/${orderID}/capture`;

      const response = await axios(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
          // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Failed to generate Access Token:', error);
      throw new InternalServerErrorException(
        'Error with paypal third-party api',
      );
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
