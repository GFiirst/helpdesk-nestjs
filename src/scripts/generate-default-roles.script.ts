import { AppDataSource } from "src/database/data-source";
import { UserRoles } from "src/roles/enums/user-roles";
import { Roles } from "src/roles/roles.entity";

const rolesAlreadyCreated: string[] = [];

async function generateDefaultRoles() {
    await AppDataSource.initialize();

    const roleRepository = AppDataSource.getRepository(Roles);

    const rolesValues = Object.values(UserRoles);

    for (const role of rolesValues) {
        const newRole = new Roles();
        newRole.role = role as UserRoles;

        const exRole = await roleRepository.findOne({
            where: {
                role: role as UserRoles
            }
        });

        if (exRole) {
            rolesAlreadyCreated.push(role);
            continue;
        }

        await roleRepository.save(newRole);
    }
}

generateDefaultRoles()
    .then(()=>{
        console.log("Default roles created successfully");
        console.log("Roles already created: " + rolesAlreadyCreated);
    })
    .catch((error)=>{
        console.error("Error creating default roles: ");
        console.error(error);
    })
    .finally(()=>{
        AppDataSource.destroy();
    })