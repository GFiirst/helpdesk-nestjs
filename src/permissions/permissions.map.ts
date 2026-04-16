import { Action } from "src/casl/enums/casl-action";
import { UserRoles } from "src/roles/enums/user-roles";

export const PERMISSIONS = {
    manage: [{
        permissions: `manage.${Action.Manage}`,
        roles: UserRoles.ADMIN
    }],
}