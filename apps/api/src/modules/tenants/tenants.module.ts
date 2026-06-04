import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantMiddleware],
  exports: [TenantsService, TenantMiddleware],
})
export class TenantsModule {}
