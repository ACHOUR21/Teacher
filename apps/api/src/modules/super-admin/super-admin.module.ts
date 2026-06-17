import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '../database/database.module';

import { SuperAdminController } from './super-admin.controller';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';


@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
  exports: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
