import { Column, Entity } from "typeorm";
import { UserRoles } from "./enums/user-roles";
import { User } from "src/users/users.entity";

@Entity()
export class Role {
    @Column({
        type: "enum",
        enum: UserRoles,
        default: UserRoles.USER
    })
    role: UserRoles;

    user: User[]
}