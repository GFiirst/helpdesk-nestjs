import { AppDataSource } from "src/database/data-source";
import { Permissions } from "src/permissions/permissions.entity";
import { PERMISSIONS } from "src/permissions/permissions.map";
import { Roles } from "src/roles/roles.entity";

async function permissionsSync() {
    await AppDataSource.initialize();

    await AppDataSource.transaction(async transactionalEntityManager => {
        const permissionsRepository = transactionalEntityManager.getRepository(Permissions);
        const rolesRepository = transactionalEntityManager.getRepository(Roles);

        await transactionalEntityManager
            .createQueryBuilder()
            .relation(Roles, "permissions")
            .of([])
            .remove({});

        await permissionsRepository.deleteAll()

        const permissionMapList = flattenPermissions(PERMISSIONS)

        for (const { permission, roles } of permissionMapList) {
            const [subject, action] = permission.split(".")

            const newPermission = new Permissions()
            newPermission.subject = subject
            newPermission.action = action

            const savedPermission = await permissionsRepository.save(newPermission)

            for(const roleName of roles) {
                const r = await rolesRepository.findOne({
                    where: {
                        role: roleName
                    },
                    relations: ["permissions"]
                })

                if(r) {
                    r.permissions.push(savedPermission)
                    await rolesRepository.save(r)
                }
            }
        }
    })
}

function flattenPermissions(perm: any) {
  const list: any = [];
  for (const moduleKey in perm) {
    for (const actionKey in perm[moduleKey]) {
      const p = perm[moduleKey][actionKey];
      list.push({
        permission: p.permissions,
        roles: p.roles,
      });
    }
  }
  return list;
}

permissionsSync()
    .then(() => {
        console.log("Permissions synchronized successfully");
    })
    .catch((error) => {
        console.error("Error synchronizing permissions: ");
        console.error(error);
    })
    .finally(() => {
        AppDataSource.destroy();
    })