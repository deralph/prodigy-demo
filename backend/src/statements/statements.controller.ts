import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/statements')
@UseGuards(JwtAuthGuard)
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get()
  getStatements(@Request() req: any, @Query() query: { startDate?: string; endDate?: string }) {
    return this.statementsService.getStatements(req.user.clientId, query);
  }
}
