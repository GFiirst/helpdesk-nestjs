import { Column, Entity, Index, ManyToOne } from "typeorm";
import { BaseEntity } from "src/database/base-entity";
import { TokenStatus } from "../enums/token-status";
import { Credential } from "./credential.entity";

@Entity()
export class RefreshToken extends BaseEntity{

    @Index({ unique: true })
    @Column({ length: 255 })
    token: string;

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

    @ManyToOne(() => Credential, (credential) => credential.refreshTokens, {
        onDelete: 'CASCADE',
    })
    credential: Credential;
}