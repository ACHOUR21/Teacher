import { Module } from '@nestjs/common';

import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantMiddleware],
  exports: [TenantsService, TenantMiddleware],
})
export class TenantsModule {}
