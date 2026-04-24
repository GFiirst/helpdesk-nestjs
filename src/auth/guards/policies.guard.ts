import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CHECK_POLICIES_KEY } from "../casl/decorators/check-policies.decorator";
import { PolicyHandler, AppAbility } from "../casl/decorators/check-policies.decorator";
import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { IS_PUBLIC_KEY } from "src/auth/decorators/is-public.decorator";
import { Action } from "../casl/enums/casl-action";


@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private caslAbilityFactory: CaslAbilityFactory,
    ) {}

    async canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if(isPublic) {
            return true;
        }

        const policyHandlers = this.reflector.get<PolicyHandler[]>(
            CHECK_POLICIES_KEY,
            context.getHandler(),
        ) || [];

        const { user } = context.switchToHttp().getRequest()
        const ability = this.caslAbilityFactory.createForUser(user);

        if(ability.can(Action.Manage, "manage")) {
            return true
        }

        return policyHandlers.every((handler) =>
            this.execPolicyHandler(handler, ability),
        );
    }

    private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
        if (typeof handler === 'function') {
          return handler(ability);
        }
        return handler.handle(ability);
    }
}