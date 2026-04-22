import { Roles } from "src/roles/roles.entity";
import { RefreshToken } from "src/token/refresh-token.entity";
import { User } from "src/users/users.entity";
import { BaseEntity } from "typeorm";

export const entities = [
    BaseEntity,
    User,
    Roles,
    Permissions,
    RefreshToken,
]