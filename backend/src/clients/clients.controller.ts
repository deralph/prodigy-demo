import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own client profile' })
  getMe(@Req() req: any) {
    return this.clientsService.getMe(req.user.clientDbId);
  }

  @Patch('me/mandate')
  @ApiOperation({ summary: 'Update joint mandate type (AND/OR)' })
  updateMandate(@Req() req: any, @Body('mandateType') mandateType: 'AND' | 'OR') {
    return this.clientsService.updateMandate(req.user.clientDbId, mandateType);
  }
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
}
