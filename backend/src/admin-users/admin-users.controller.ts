import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

// Managing other admins' accounts (creating logins, changing roles,
// locking/unlocking access) is the single most sensitive admin capability
// in the system — restricted to SUPER_ADMIN only, not just any admin.
@Controller('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; email: string; role: string; password: string }, @Req() req: any) {
    return this.adminUsersService.create(body, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.adminUsersService.update(id, body, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
