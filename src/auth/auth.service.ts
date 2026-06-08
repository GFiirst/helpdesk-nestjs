import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Credential } from "src/auth/entities/credential.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Credential)
        private credentialRepository: Repository<Credential>,
        private jwtService: JwtService
    ){}

    async login(){}
}