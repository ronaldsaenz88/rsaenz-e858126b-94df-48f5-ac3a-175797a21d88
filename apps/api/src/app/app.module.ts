import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import entities
import { User } from '@libs/data/src/entities/user';
import { Organization } from '@libs/data/src/entities/organization';
import { Permission } from '@libs/data/src/entities/permission';
import { Role } from '@libs/data/src/entities/role';
import { Task } from '@libs/data/src/entities/task';
import { AuditLog } from '@libs/data/src/entities/audit-log';
// Import modules
import { TaskModule } from '@apps/api/src/task/task.module';
import { AuthModule } from '@apps/api/src/auth/auth.module';
import { AuditModule } from '@apps/api/src/audit/audit.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'sqlite',
      port: +process.env.DB_PORT,
      host: process.env.POSTGRES_HOST,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Organization, Permission, Role, Task, AuditLog],
      synchronize: true, //TODO: Remove for prod. Only use in development!
    }),
    // Other modules...
    TaskModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
