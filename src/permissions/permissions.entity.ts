import { Column, Entity, ManyToMany } from "typeorm";
import { Action } from "src/casl/enums/casl-action";
import { Subjects } from "src/casl/enums/casl-subject";
import { Roles } from "src/roles/roles.entity";
import { BaseEntity } from "src/database/base-entity";

@Entity()
export class Permissions extends BaseEntity{
    @Column({
        type: "enum",
        enum: Action
    })
    action: Action;

    @Column()
    subject: Subjects;

    @ManyToMany(() => Roles, (roles) => roles.permissions)
    roles: Roles[];
}