import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  @HttpCode(200)
  handlePaystack(@Body() body: any, @Headers('x-paystack-signature') signature: string) {
    return this.webhooksService.handlePaystack(body, signature);
  }
}
