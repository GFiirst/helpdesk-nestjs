import { BaseEntity } from "src/database/base-entity";
import { Column, Entity, OneToOne } from "typeorm";
import { User } from "./users.entity";

@Entity()
export class Profile extends BaseEntity{
    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    //new table soon
    @Column({ nullable: true })
    department: string;

    //new table soon
    @Column({ nullable: true })
    branch: string;

    //new table soon
    @Column({ nullable: true })
    remoteAccess: string;

    @Column({ default: true })
    isAvailable: boolean;

    @OneToOne(() => User, user => user.profile)
    user: User;
}