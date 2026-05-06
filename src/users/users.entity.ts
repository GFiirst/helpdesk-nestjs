import { Credential } from "src/auth/entities/credential.entity";
import { BaseEntity } from "src/database/base-entity";
import { Roles } from "src/roles/roles.entity";
import { JoinColumn, JoinTable, ManyToMany, OneToOne } from "typeorm";


export class User extends BaseEntity {
    @OneToOne(() => Credential, credential => credential.user)
    @JoinColumn()
    credential: Credential;

    @ManyToMany(() => Roles, (role) => role.users)
    @JoinTable()
    roles: Roles[];
}