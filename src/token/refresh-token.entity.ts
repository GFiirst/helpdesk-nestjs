import { Column, Entity, Index, ManyToOne } from "typeorm";
import { TokenStatus } from "./enum/token-status";
import { BaseEntity } from "src/database/base-entity";
import { User } from "src/users/users.entity";

@Entity()
export class RefreshToken extends BaseEntity{

    @Index({ unique: true })
    @Column({ length: 255 })
    tokenHash: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({
    type: 'enum',
    enum: TokenStatus,
    default: TokenStatus.ACTIVE,
    })
    status: TokenStatus;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    device: string;

    @Column({ nullable: true })
    ip: string;

    @ManyToOne(() => User, (user) => user.refreshTokens, {
        onDelete: 'CASCADE',
    })
    user: User;
}