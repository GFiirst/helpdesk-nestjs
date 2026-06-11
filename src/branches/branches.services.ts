import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Branches } from "./branches.entity";
import { DataSource, Not, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { createBranchDto } from "./dto/create-branch.dto";
import { User } from "src/users/entity/user.entity";

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branches)
        private branchesRepository: Repository<Branches>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ){}

    async createBranch(dto: createBranchDto, user: User){

        const userWithBranches = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['branches']
        })
        
        const userPermission = (userWithBranches?.branches ?? []).map(branch => branch.name);

        if(!userPermission.includes(process.env.ADMIN_BRANCH!)){
            throw new ForbiddenException('You do not have permission to create a branch')
        }
        
        const existingBranch = await this.branchesRepository.findOne(
            {
                where: { name: dto.name}
            }
        )

        if(existingBranch){
            throw new ConflictException('Branch with this name already exists')
        }

        const branch = new Branches();
        branch.name = dto.name;
        await this.branchesRepository.save(branch);

        return branch;
    }

    async listBranches(){
        return this.branchesRepository.find({
            where: {
                name: Not(process.env.ADMIN_BRANCH!)
            },
            select: {
                id: true,
                name: true
            }
        })
    }

    async listAllBranches(user: User){

        const userWithBranches = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['branches']
        })
        
        const userPermission = (userWithBranches?.branches ?? []).map(branch => branch.name);

        if(!userPermission.includes(process.env.ADMIN_BRANCH!)){
            throw new ForbiddenException('You do not have permission to view all branches')
        }

        return this.branchesRepository.find({
            select: {
                id: true,
                name: true
            }
        })
    }
}