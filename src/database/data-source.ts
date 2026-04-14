import { DataSource } from "typeorm";
import { entities } from "./entities";

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE! as 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT!,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: entities,
    synchronize: !!process.env.DB_SYNC,
    migrations: ['dist/database/migrations/*.js'],
});