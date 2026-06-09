import { AppDataSource } from "src/database/data-source";
import { UserRoles } from "src/roles/enums/user-roles";
import { Roles } from "src/roles/roles.entity";
import { Credential } from "src/auth/entities/credential.entity";
import { User } from "src/users/entity/user.entity";
import { Profile } from "src/users/entity/profile.entity";
import * as bcrypt from "bcrypt";
import { Branches } from "src/branches/branches.entity";

async function generateDefaultUsers() {
    await AppDataSource.initialize();

    const credentialRepository = AppDataSource.getRepository(Credential);
    const roleRepository = AppDataSource.getRepository(Roles);
    const userRepository = AppDataSource.getRepository(User);
    const profileRepository = AppDataSource.getRepository(Profile);
    const branchRepository = AppDataSource.getRepository(Branches);

    const existsAdminUser = await credentialRepository.findOne({
        where: {
            email: process.env.ADMIN_EMAIL!
        }
    })

    if(!existsAdminUser) {
        await adminUser(roleRepository, credentialRepository, userRepository, profileRepository, branchRepository)
    }
}

async function adminUser(roleRepository: any, credentialRepository: any, userRepository: any, profileRepository: any, branchRepository: any) {

    const adminBranch = await branchRepository.findOne({
        where: {
            name: process.env.ADMIN_BRANCH!
        }
    })
    
    if(!adminBranch) {
        throw new Error("Admin branch not found. Please run the generate-default-branches script first.");
    }

    const adminRole = await roleRepository.findOne({
        where: {
            role: UserRoles.ADMIN
        }
    })

    if(!adminRole) {
        throw new Error("Admin role not found. Please run the generate-default-roles script first.");
    }

    const credential = new Credential();
    credential.email = process.env.ADMIN_EMAIL!;
    credential.password = await bcrypt.hash(process.env.ADMIN_PASSWORD!, +process.env.BCRYPT_SALT!);

    await credentialRepository.save(credential);

    const user = new User();
    user.credential = credential;
    user.roles = [adminRole];
    user.branches = [adminBranch];
    await userRepository.save(user);

    const profile = new Profile();
    profile.name = process.env.ADMIN_NAME ?? "Admin";
    profile.user = user;
    await profileRepository.save(profile);
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