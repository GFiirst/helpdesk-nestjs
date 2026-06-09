import { Injectable } from "@nestjs/common";
import { Branches } from "./branches.entity";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branches)
        private branchesRepository: Repository<Branches>,
        private readonly dataSource: DataSource,
    ){}
}