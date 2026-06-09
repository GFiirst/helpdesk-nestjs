import { BaseEntity } from "src/database/base-entity";
import { User } from "src/users/entity/user.entity";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

@Entity()
export class Branches extends BaseEntity {

    @Column({
        unique: true,
        length: 200
    })
    name: string;

    @ManyToMany(() => User, (user) => user.branches)
    @JoinTable()
    users: User[];
}