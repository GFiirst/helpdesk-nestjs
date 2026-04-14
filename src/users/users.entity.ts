import { BaseEntity } from "src/database/base-entity";
import { Column, Entity, Index } from "typeorm";

@Entity()
export class User extends BaseEntity {
    @Column({ length: 255 })
    name: string;

    @Index('users_email_unique_active', ['email'], {
        unique: true,
        where: '"deletedAt" IS NULL',
    })
    @Column({ length: 255 })
    email: string;

    @Column({ length: 255 })
    password: string;
}