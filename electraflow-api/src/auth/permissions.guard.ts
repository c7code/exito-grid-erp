import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (...modules: string[]) => SetMetadata(PERMISSION_KEY, modules);

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredModules = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredModules) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        // Admin tem acesso total
        if (user.role === 'admin') {
            return true;
        }

        // Verifica se o usuário tem permissão para pelo menos um dos módulos
        const userPermissions: string[] = user.permissions || [];
        return requiredModules.some((mod) => userPermissions.includes(mod));
    }
}
