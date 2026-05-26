import { Module } from '@nestjs/common';
import { NibssController } from './nibss.controller';
import { NibssService } from './nibss.service';

@Module({
  controllers: [NibssController],
  providers: [NibssService],
  exports: [NibssService],
})
export class NibssModule {}
