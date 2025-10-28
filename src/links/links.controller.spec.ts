import { Test, TestingModule } from '@nestjs/testing'
import { ClientsModule } from '@nestjs/microservices'
import { getLinkServiceConfig } from '@wo0zz1/url-shortener-shared'

import { GeoIPModule } from '../geo-ip/geo-ip.module'
import { PrismaModule } from '../prisma/prisma.module'

import { LinksController } from './links.controller'

import { LinksService } from './links.service'

describe('LinksController', () => {
	let controller: LinksController

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				ClientsModule.register([getLinkServiceConfig(process.env.RABBITMQ_URL!)]),
				GeoIPModule,
				PrismaModule,
			],
			controllers: [LinksController],
			providers: [LinksService],
		}).compile()

		controller = module.get<LinksController>(LinksController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})
})
