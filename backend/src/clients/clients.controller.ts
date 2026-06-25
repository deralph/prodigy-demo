import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own client profile' })
  getMe(@Req() req: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have a client profile.');
    }
    return this.clientsService.getMe(req.user.clientDbId);
  }

  // NOTE: there is intentionally no self-service mandate update here.
  // The mandate type (AND/OR) is a control that governs whether a single
  // joint holder can authorise withdrawals — allowing a client to change it
  // themselves would let them downgrade AND→OR and bypass the very mandate
  // rule withdrawals are supposed to enforce. Mandate changes are admin/
  // compliance-only — see AdminClientsController.updateMandate below.
}

@ApiTags('Admin — Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/clients')
export class AdminClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients with filters' })
  findAll(@Query() query: { search?: string; type?: string; status?: string }) {
    return this.clientsService.findAll(query);
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get single client full profile' })
  findOne(@Param('clientId') clientId: string) {
    return this.clientsService.findOne(clientId);
  }

  @Patch(':clientId/status')
  @ApiOperation({ summary: 'Update client status (approve, suspend, activate)' })
  updateStatus(
    @Param('clientId') clientId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.clientsService.updateStatus(clientId, status, req.user.sub);
  }

  @Patch(':clientId/mandate')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Compliance: update a joint account mandate type (AND/OR) — auditable' })
  updateMandate(
    @Param('clientId') clientId: string,
    @Body('mandateType') mandateType: 'AND' | 'OR',
    @Req() req: any,
  ) {
    return this.clientsService.updateMandateByClientRef(clientId, mandateType, {
      adminId: req.user.sub,
      adminRole: req.user.adminRole,
    });
  }
}
