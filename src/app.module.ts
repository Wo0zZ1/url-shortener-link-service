import { Module } from '@nestjs/common'

import { LinksModule } from './links/links.module'

import { AppController } from './app.controller'

import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'

@Module({
	imports: [LinksModule, PrismaModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
