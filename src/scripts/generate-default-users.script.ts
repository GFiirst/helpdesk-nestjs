import { AppDataSource } from "src/database/data-source";
import { UserRoles } from "src/roles/enums/user-roles";
import { Roles } from "src/roles/roles.entity";
import { Credential } from "src/auth/entities/credential.entity";
import * as bcrypt from "bcrypt";

async function generateDefaultUsers() {
    await AppDataSource.initialize();

    const credentialRepository = AppDataSource.getRepository(Credential);
    const roleRepository = AppDataSource.getRepository(Roles);

    const existsAdminUser = await credentialRepository.findOne({
        where: {
            email: process.env.ADMIN_EMAIL!
        }
    })

    if(!existsAdminUser) {
        await adminUser(roleRepository, credentialRepository)
    }
}

async function adminUser(roleRepository: any, credentialRepository: any) {
    const adminRole = await roleRepository.findOne({
        where: {
            role: UserRoles.ADMIN
        }
    })

    if(!adminRole) {
        throw new Error("Admin role not found. Please run the generate-default-roles script first.");
    }

    const newAdminUser = new Credential();

    const criptPass = await bcrypt.hash(process.env.ADMIN_PASSWORD!, +process.env.BCRYPT_SALT!);

    newAdminUser.email = process.env.ADMIN_EMAIL!;
    newAdminUser.password = criptPass;
    newAdminUser.roles = [adminRole];

    await credentialRepository.save(newAdminUser);
}

generateDefaultUsers()
    .then(()=>{
        console.log("Default users created successfully");
    })
    .catch((error)=>{
        console.error("Error creating default users: ");
        console.error(error);
    })
    .finally(()=>{
        AppDataSource.destroy();
    })