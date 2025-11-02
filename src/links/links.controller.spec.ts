import { Test, TestingModule } from '@nestjs/testing'

import { GeoIPModule } from '../geo-ip/geo-ip.module'

import { LinksController } from './links.controller'

import { LinksService } from './links.service'

describe('LinksController', () => {
	let controller: LinksController

	const mockLinksService = {
		findAll: jest.fn().mockResolvedValue([]),
		findOne: jest.fn().mockResolvedValue({ id: 1, url: 'http://example.com' }),
		create: jest.fn().mockResolvedValue({ id: 1, url: 'http://example.com' }),
		update: jest.fn().mockResolvedValue({ id: 1, url: 'http://example.com' }),
		remove: jest.fn().mockResolvedValue({ id: 1 }),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [GeoIPModule],
			controllers: [LinksController],
			providers: [{ provide: LinksService, useValue: mockLinksService }],
		}).compile()

		controller = module.get<LinksController>(LinksController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})
})
