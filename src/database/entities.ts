import { Roles } from "src/roles/roles.entity";
import { RefreshToken } from "src/auth/entities/refresh-token.entity";
import { User } from "src/users/users.entity";
import { BaseEntity } from "typeorm";
import { Permissions } from "src/permissions/permissions.entity";

export const entities = [
    BaseEntity,
    User,
    Roles,
    Permissions,
    RefreshToken,
]