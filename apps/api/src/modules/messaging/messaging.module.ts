import { Module } from '@nestjs/common';
import { MessagingController } from './presentation/controllers/messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './presentation/gateways/messaging.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
