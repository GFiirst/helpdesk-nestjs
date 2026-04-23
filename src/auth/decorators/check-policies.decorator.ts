import { MongoAbility, MongoQuery } from "@casl/ability";
import { SetMetadata } from "@nestjs/common";
import { Action } from "src/casl/enums/casl-action";
import { Subjects } from "src/casl/enums/casl-subject";

export const CHECK_POLICIES_KEY = 'check_policy';

export type AppAbility = MongoAbility<[Action, Subjects], MongoQuery>;

interface IPolicyHandler {
    handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);