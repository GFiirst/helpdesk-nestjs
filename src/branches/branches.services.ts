import { ConflictException, Injectable } from "@nestjs/common";
import { Branches } from "./branches.entity";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { createBranchDto } from "./dto/create-branch.dto";

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branches)
        private branchesRepository: Repository<Branches>,
        private readonly dataSource: DataSource,
    ){}

    async createBranch(dto: createBranchDto){
        
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
}