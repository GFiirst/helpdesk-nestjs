import { Module } from "@nestjs/common";
import { Branches } from "./branches.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Branches])],
    controllers: [],
    providers: [],
    exports: []
})
export class BranchesModule{}