import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List active investment products' })
  findAll() {
    return this.productsService.findAll(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all products (all statuses)' })
  findAllAdmin() {
    return this.productsService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Admin: create new product' })
  create(@Body() body: any, @Req() req: any) {
    return this.productsService.create(body, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Admin: update product settings' })
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.productsService.update(id, body, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
