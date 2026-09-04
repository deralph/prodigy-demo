import { Controller, Post, Headers, HttpCode, Req, UnauthorizedException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  @HttpCode(200)
  handlePaystack(@Req() req: any, @Headers('x-paystack-signature') signature: string) {
    // rawBody is the exact byte-for-byte request body received by Nest —
    // Paystack's HMAC is computed over those bytes, so we must verify against
    // them (never a re-serialized object).
    const rawBody: Buffer | undefined = req.rawBody;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      throw new UnauthorizedException('Missing webhook payload');
    }
    return this.webhooksService.handlePaystack(rawBody, signature);
  }
}