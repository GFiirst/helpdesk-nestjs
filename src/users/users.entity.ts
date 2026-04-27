import { BaseEntity } from "src/database/base-entity";
import { Roles } from "src/roles/roles.entity";
import { RefreshToken } from "src/auth/entities/refresh-token.entity";
import { Column, Entity, Index, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class User extends BaseEntity {
    @Index('users_email_unique_active', ['email'], {
        unique: true,
        where: '"deletedAt" IS NULL',
    })
    @Column({ length: 255 })
    email: string;

    @Column({ length: 255 })
    password: string;

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens: RefreshToken[];

    @ManyToMany(() => Roles, (roles) => roles.user)
    roles: Roles[];
}