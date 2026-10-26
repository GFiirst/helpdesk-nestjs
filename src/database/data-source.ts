import { DataSource } from 'typeorm';
import { entities } from './entities';
import 'dotenv/config';
import { validateEnvironment } from '../config/environment';

const environment = validateEnvironment(process.env);

export const AppDataSource = new DataSource({
  type: environment.DB_TYPE,
  host: environment.DB_HOST,
  port: environment.DB_PORT,
  username: environment.DB_USERNAME,
  password: environment.DB_PASSWORD,
  database: environment.DB_NAME,
  entities: entities,
  synchronize: environment.DB_SYNC,
  migrations: ['dist/database/migrations/*.js'],
});
