import { Module } from '@nestjs/common';
import { DividendsController } from './dividends.controller';
import { DividendsService } from './dividends.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DividendsController],
  providers: [DividendsService],
  exports: [DividendsService],
})
export class DividendsModule {}
