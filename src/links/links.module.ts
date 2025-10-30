import { Module } from '@nestjs/common'
import { getEventEmitterConfig } from '@wo0zz1/url-shortener-shared'

import { ClientsModule } from '@nestjs/microservices'
import { GeoIPModule } from 'src/geo-ip/geo-ip.module'

import { LinksController } from './links.controller'
import { LinksEventHandler } from './links.event-handler'

import { LinksService } from './links.service'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
	imports: [
		ClientsModule.register([getEventEmitterConfig(process.env.RABBITMQ_URL!)]),
		GeoIPModule,
		PrismaModule,
	],
	controllers: [LinksController, LinksEventHandler],
	providers: [LinksService],
	exports: [LinksService],
})
export class LinksModule {}
