import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

interface RequestUser {
  role?: string;
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    return user?.role === 'SUPER_ADMIN';
  }
}
