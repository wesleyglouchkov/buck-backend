import 'dotenv/config';
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.NODE_ENV === 'development' ? env('DATABASE_URL_DEV') : env('DATABASE_URL'),
    },
});
