import { AbilityBuilder, createMongoAbility, MongoAbility, MongoQuery } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { User } from "src/users/users.entity";
import { Subjects } from "./enums/casl-subject";
import { Action } from "./enums/casl-action";

@Injectable()
export class CaslAbilityFactory {

    createForUser(user: User) {
        const { can, cannot, build } = new AbilityBuilder<
        MongoAbility<[Action, Subjects], MongoQuery>
        >(createMongoAbility);
    }

}