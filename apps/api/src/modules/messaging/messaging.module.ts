import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { MessagingService } from './messaging.service';
import { MessagingController } from './presentation/controllers/messaging.controller';
import { MessagingGateway } from './presentation/gateways/messaging.gateway';


@Module({
  imports: [DatabaseModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
