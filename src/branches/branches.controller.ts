import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { BranchesService } from "./branches.services";
import { AppAbility, CheckPolicies } from "src/casl/decorators/check-policies.decorator";
import { Action } from "src/casl/enums/casl-action";
import { createBranchDto } from "./dto/create-branch.dto";
import { ApiBody } from "@nestjs/swagger";
import { Public } from "src/auth/decorators/is-public.decorator";
import { User } from "src/users/entity/user.entity";

@Controller('branches')
export class BranchesController{
    constructor(
        private readonly branchesService: BranchesService
    ){}

    @Post('create')
    @ApiBody({type: createBranchDto})
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, "manage"))
    async createBranch(
        @Body() dto: createBranchDto,
        @Req() request
    ){  
        const user: User = request.user;
        return this.branchesService.createBranch(dto, user)
    }

    @Get()
    @Public()
    async listBranches(){
        return this.branchesService.listBranches()
    }

    @Get('all')
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, "manage"))
    async listAllBranches(
        @Req() request
    ){
        const user: User = request.user;
        return this.branchesService.listAllBranches(user)
    }
}