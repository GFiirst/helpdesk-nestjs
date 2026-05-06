import { AppDataSource } from "src/database/data-source";
import { UserRoles } from "src/roles/enums/user-roles";
import { Roles } from "src/roles/roles.entity";
import { User } from "src/auth/entities/credential.entity";
import * as bcrypt from "bcrypt";

async function generateDefaultUsers() {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Roles);

    const existsAdminUser = await userRepository.findOne({
        where: {
            email: process.env.ADMIN_EMAIL!
        }
    })

    if(!existsAdminUser) {
        await adminUser(roleRepository, userRepository)
    }
}

async function adminUser(roleRepository: any, userRepository: any) {
    const adminRole = await roleRepository.findOne({
        where: {
            role: UserRoles.ADMIN
        }
    })

    if(!adminRole) {
        throw new Error("Admin role not found. Please run the generate-default-roles script first.");
    }

    const newAdminUser = new User();

    const criptPass = await bcrypt.hash(process.env.ADMIN_PASSWORD!, +process.env.BCRYPT_SALT!);

    newAdminUser.email = process.env.ADMIN_EMAIL!;
    newAdminUser.password = criptPass;
    newAdminUser.roles = [adminRole];

    await userRepository.save(newAdminUser);
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