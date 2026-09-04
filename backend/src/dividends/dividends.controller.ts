import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DividendsService } from './dividends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Dividends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/dividends')
export class DividendsController {
  constructor(private dividendsService: DividendsService) {}

  @Get()
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'FINANCE', 'AUDIT')
  @ApiOperation({ summary: 'List all dividend declarations' })
  findAll() {
    return this.dividendsService.findAll();
  }

  @Post()
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Declare a new dividend for a product' })
  declare(@Body() body: any, @Req() req: any) {
    return this.dividendsService.declare(body, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
