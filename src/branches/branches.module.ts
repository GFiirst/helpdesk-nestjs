import { Module } from "@nestjs/common";
import { Branches } from "./branches.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/users/entity/user.entity";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.services";

@Module({
    imports: [TypeOrmModule.forFeature([Branches, User])],
    controllers: [BranchesController],
    providers: [BranchesService],
    exports: []
})
export class BranchesModule{}