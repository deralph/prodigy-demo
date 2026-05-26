import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { EodService } from './eod.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/eod')
@UseGuards(JwtAuthGuard)
export class EodController {
  constructor(private readonly eodService: EodService) {}

  @Post('run')
  runEod() {
    return this.eodService.runEod();
  }

  @Get('history')
  getHistory() {
    return this.eodService.getHistory();
  }
}
