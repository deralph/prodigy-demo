import { Module } from '@nestjs/common';
import { ClientsController, AdminClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  controllers: [ClientsController, AdminClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
