import { BaseEntity } from "src/database/base-entity";
import { Roles } from "src/roles/roles.entity";
import { RefreshToken } from "src/auth/entities/refresh-token.entity";
import { Column, Entity, Index, ManyToMany, OneToMany, OneToOne } from "typeorm";
import { User } from "src/users/entity/users.entity";

@Entity()
export class Credential extends BaseEntity {
    @Index('credential_email_unique_active', ['email'], {
        unique: true,
        where: '"deletedAt" IS NULL',
    })
    @Column({ length: 255 })
    email: string;

    @Column({ length: 255 })
    password: string;

    @OneToOne(() => User, user => user.credential)
    user: User;

    @OneToMany(() => RefreshToken, (token) => token.credential)
    refreshTokens: RefreshToken[];
}