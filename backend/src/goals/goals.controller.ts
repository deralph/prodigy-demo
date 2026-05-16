import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own investment goals' })
  findAll(@Req() req: any) {
    return this.goalsService.findAll(req.user.clientDbId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  create(@Req() req: any, @Body() body: any) {
    return this.goalsService.create(req.user.clientDbId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.goalsService.update(req.user.clientDbId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.remove(req.user.clientDbId, id);
  }
}
