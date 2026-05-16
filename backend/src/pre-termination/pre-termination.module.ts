import { Module } from '@nestjs/common';
import { PreTerminationController } from './pre-termination.controller';
import { PreTerminationService } from './pre-termination.service';

@Module({
  controllers: [PreTerminationController],
  providers: [PreTerminationService],
  exports: [PreTerminationService],
})
export class PreTerminationModule {}
