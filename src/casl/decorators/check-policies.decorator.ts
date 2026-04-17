import { MongoAbility, MongoQuery } from "@casl/ability";
import { Action } from "../enums/casl-action";
import { Subjects } from "../enums/casl-subject";
import { SetMetadata } from "@nestjs/common";

export const CHECK_POLICIES_KEY = 'check_policy';

export type AppAbility = MongoAbility<[Action, Subjects], MongoQuery>;

interface IPolicyHandler {
    handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);