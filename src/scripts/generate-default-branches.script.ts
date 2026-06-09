import { Branches } from "src/branches/branches.entity";
import { AppDataSource } from "src/database/data-source";

async function generateDefaultBranches(){
    await AppDataSource.initialize();

    const branchRepository = AppDataSource.getRepository(Branches);

    const branch = new Branches();
    branch.name = process.env.ADMIN_BRANCH!;

    const existingBranch = await branchRepository.findOne(
        {
            where: {
                name: process.env.ADMIN_BRANCH!
            }
        }
    )

    if(existingBranch){
        console.log(`Branch with name ${process.env.ADMIN_BRANCH} already exists.`);
        return;
    }

    await branchRepository.save(branch);
}

generateDefaultBranches()
    .then(()=>{
        console.log("Default branch created successfully");
    })
    .catch((error)=>{
        console.error("Error creating default branch");
        console.error(error);
    })
    .finally(()=>{
        AppDataSource.destroy();
    })