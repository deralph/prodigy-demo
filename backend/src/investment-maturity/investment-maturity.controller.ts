import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvestmentMaturityService } from './investment-maturity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Investment Maturity')
@ApiBearerAuth()
@Controller('admin/investments/maturity')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'FINANCE')
export class InvestmentMaturityController {
  constructor(private readonly maturityService: InvestmentMaturityService) {}

  @Post('run')
  @ApiOperation({ summary: 'Manually run the maturity check (sends reminders, marks matured investments) — normally runs automatically once a day' })
  run(@Req() req: any) {
    return this.maturityService.run({ adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
