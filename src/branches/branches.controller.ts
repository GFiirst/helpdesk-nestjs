import { Controller } from "@nestjs/common";
import { BranchesService } from "./branches.services";

@Controller('branches')
export class BranchesController{
    constructor(
        private readonly branchesService: BranchesService
    ){}
}