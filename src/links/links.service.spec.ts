import { Test, TestingModule } from '@nestjs/testing'
import { ClientsModule } from '@nestjs/microservices'
import { getEventEmitterConfig } from '@wo0zz1/url-shortener-shared'

import { LinksService } from './links.service'
import { PrismaModule } from '../prisma/prisma.module'
import { GeoIPModule } from '../geo-ip/geo-ip.module'

describe('LinksService', () => {
	let service: LinksService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				ClientsModule.register([getEventEmitterConfig(process.env.RABBITMQ_URL!)]),
				GeoIPModule,
				PrismaModule,
			],
			providers: [LinksService],
		}).compile()

		service = module.get<LinksService>(LinksService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})
})
