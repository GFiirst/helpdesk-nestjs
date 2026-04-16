import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { UserRoles } from "./enums/user-roles";
import { User } from "src/users/users.entity";
import { Permissions } from "src/permissions/permissions.entity";

@Entity()
export class Roles {
    @Column({
        type: "enum",
        enum: UserRoles,
        default: UserRoles.USER
    })
    role: UserRoles;

    @ManyToMany(()=> User, (user) => user.roles)
    @JoinTable()
    user: User[]

    @ManyToMany(() => Permissions, (permission) => permission.roles)
    @JoinTable()
    permissions: Permissions[]
}