import { Body, Controller, Post } from "@nestjs/common";
import { BranchesService } from "./branches.services";
import { AppAbility, CheckPolicies } from "src/casl/decorators/check-policies.decorator";
import { Action } from "src/casl/enums/casl-action";
import { createBranchDto } from "./dto/create-branch.dto";
import { ApiBody } from "@nestjs/swagger";

@Controller('branches')
export class BranchesController{
    constructor(
        private readonly branchesService: BranchesService
    ){}

    @Post('create')
    @ApiBody({type: createBranchDto})
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, "manage"))
    async createBranch(
        @Body() dto: createBranchDto
    ){
        await this.branchesService.createBranch(dto)
    }
}