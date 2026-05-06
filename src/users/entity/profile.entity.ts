import { BaseEntity } from "src/database/base-entity";
import { Column, Entity, OneToOne } from "typeorm";
import { User } from "./users.entity";

@Entity()
export class Profile extends BaseEntity{
    @Column()
    name: string;

    @Column({ nullable: true })
    anydeskId: string;

    // @Column({ nullable: true })
    // department: string;

    @OneToOne(() => User, user => user.profile)
    user: User;
}