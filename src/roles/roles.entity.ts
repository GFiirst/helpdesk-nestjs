import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { UserRoles } from "./enums/user-roles";
import { Permissions } from "src/permissions/permissions.entity";
import { BaseEntity } from "src/database/base-entity";

@Entity()
export class Roles extends BaseEntity{
    @Column({
        type: "enum",
        enum: UserRoles,
        default: UserRoles.USER
    })
    role: UserRoles;

    // @ManyToMany(()=> User, (user) => user.roles)
    // @JoinTable()
    // user: User[]

    @ManyToMany(() => Permissions, (permission) => permission.roles)
    @JoinTable()
    permissions: Permissions[]
}