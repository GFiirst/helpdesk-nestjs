import { Credential } from "src/auth/entities/credential.entity";
import { Roles } from "src/roles/roles.entity";
import { RefreshToken } from "src/auth/entities/refresh-token.entity";
import { User } from "src/users/entity/users.entity";
import { Profile } from "src/users/entity/profile.entity";
import { Permissions } from "src/permissions/permissions.entity";

export const entities = [
    Credential,
    User,
    Profile,
    Roles,
    Permissions,
    RefreshToken,
]