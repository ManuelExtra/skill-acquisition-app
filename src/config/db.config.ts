import { registerAs } from '@nestjs/config';

const env = process.env.NODE_ENV;

export default registerAs('database', () => ({
  host: env ? process.env.ONLINE_DATABASE_HOST : process.env.DATABASE_HOST,
  username: env
    ? process.env.ONLINE_DATABASE_USERNAME
    : process.env.DATABASE_USERNAME,
  password: env
    ? process.env.ONLINE_DATABASE_PASSWORD
    : process.env.DATABASE_PASSWORD,
  name: env ? process.env.ONLINE_DATABASE_NAME : process.env.DATABASE_NAME,
  port: env
    ? process.env.ONLINE_DATABASE_PORT
    : parseInt(process.env.DATABASE_PORT, 10),
  synchronize: env ? false : true,
  autoLoadEntities: env ? false : true,
}));
