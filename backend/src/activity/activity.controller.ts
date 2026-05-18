import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getMyActivity(@Request() req: any, @Query() query: { page?: string; limit?: string }) {
    return this.activityService.getClientActivity(req.user.clientId, query);
  }
}
