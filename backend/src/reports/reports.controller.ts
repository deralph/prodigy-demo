import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Query() query: { type?: string }) {
    return this.reportsService.findAll(query);
  }

  @Get('generate')
  generate(@Query() query: { type: string; startDate?: string; endDate?: string }) {
    return this.reportsService.generate(query);
  }
}
