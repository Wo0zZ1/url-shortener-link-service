import { Test, TestingModule } from '@nestjs/testing'
import { EVENT_EMITTER_NAME } from '@wo0zz1/url-shortener-shared'

import { GeoIPModule } from '../geo-ip/geo-ip.module'

import { LinksService } from './links.service'
import { PrismaService } from '..//prisma/prisma.service'

describe('LinksService', () => {
	let service: LinksService

	const mockPrismaService = {
		link: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	}

	const mockEventEmitter = {
		emit: jest.fn(),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [GeoIPModule],
			providers: [
				LinksService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: EVENT_EMITTER_NAME, useValue: mockEventEmitter },
			],
		}).compile()

		service = module.get<LinksService>(LinksService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})
})
