import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { LegacyService } from './legacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/legacy')
@UseGuards(JwtAuthGuard)
export class LegacyController {
  constructor(private readonly legacyService: LegacyService) {}

  @Get()
  getLegacyPlan(@Request() req: any) {
    return this.legacyService.getLegacyPlan(req.user.clientId);
  }
}
