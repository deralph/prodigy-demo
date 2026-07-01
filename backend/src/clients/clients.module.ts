import { Module } from '@nestjs/common';
import { ClientsController, AdminClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ClientsController, AdminClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
