import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { ErrorMessageConstants } from '@/constants/error-code.constant';
import { ROLES_KEY } from '@/decorators/roles.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(ErrorMessageConstants.AUTH.FORBIDDEN);
  }
}
