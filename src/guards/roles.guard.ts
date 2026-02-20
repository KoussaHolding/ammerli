
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/decorators/roles.decorator';
import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { ErrorCode, ErrorMessageConstants } from '@/constants/error-code.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
         throw new ForbiddenException(ErrorMessageConstants.AUTH.FORBIDDEN.CODE);
    }

    if (requiredRoles.includes(user.role)) {
        return true;
    }
    
    throw new ForbiddenException(ErrorMessageConstants.AUTH.FORBIDDEN.CODE);
  }
}
