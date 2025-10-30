import QRCode from 'qrcode'
import useragent from 'express-useragent'
import {
	Inject,
	Injectable,
	NotFoundException,
	ConflictException,
	OnModuleInit,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
	GetUserLinksResponse,
	CreateLinkResponse,
	GetQRCodeResponse,
	ILink,
	ILinkStats,
	LinkRedirectEvent,
	EEventPattern,
	CreateLinkDto,
	EVENT_EMITTER_NAME,
} from '@wo0zz1/url-shortener-shared'

import { PrismaService } from '../prisma/prisma.service'
import { GeoIPService } from '../geo-ip/geo-ip.service'

@Injectable()
export class LinksService implements OnModuleInit {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly geoIPService: GeoIPService,
		@Inject(EVENT_EMITTER_NAME) private readonly eventEmitter: ClientProxy,
	) {}

	async onModuleInit() {
		await Promise.all([this.eventEmitter.connect()])
	}

	private generateShortLink(): string {
		return Math.random().toString(36).substring(2, 8)
	}

	async redirect(shortLink: string, userAgent?: string, ip?: string) {
		const link = await this.getLinkByShortLink(shortLink)

		if (!link) throw new NotFoundException('Link not found')

		if (link.linkStats) {
			const linkRedirectData: LinkRedirectEvent = {
				linkId: link.id,
				userAgent: userAgent,
				ip: ip,
				timestamp: new Date(),
			}

			this.eventEmitter.emit(EEventPattern.LINK_REDIRECT, linkRedirectData)
		}

		return link.baseLink
	}

	async createLink(userId: number, createLinkDto: CreateLinkDto): Promise<ILink> {
		const shortLink = createLinkDto.customShortLink || this.generateShortLink()

		const existingLink = await this.prismaService.link.findUnique({
			where: { shortLink },
		})

		if (existingLink) throw new ConflictException('Short link already exists')

		const createdLink = await this.prismaService.link.create({
			data: {
				userId: userId,
				baseLink: createLinkDto.baseLink,
				shortLink,
				linkStats: { create: {} },
			},
			include: {
				linkStats: {
					include: {
						linkRedirects: true,
					},
				},
			},
		})

		return createdLink as CreateLinkResponse
	}

	async getLinkByShortLink(shortLink: string): Promise<ILink | null> {
		const link = await this.prismaService.link.findUnique({
			where: { shortLink },
			include: {
				linkStats: {
					include: {
						linkRedirects: true,
					},
				},
			},
		})

		return link
	}

	async getUserLinks(
		userId: number,
		page: number = 1,
		limit: number = 20,
	): Promise<GetUserLinksResponse> {
		const skip = (page - 1) * limit

		const [links, total] = await Promise.all([
			this.prismaService.link.findMany({
				where: { userId },
				include: {
					linkStats: {
						include: {
							linkRedirects: {
								orderBy: { clickedAt: 'desc' },
								take: 10,
							},
						},
					},
				},
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prismaService.link.count({ where: { userId } }),
		])

		return {
			links,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		}
	}

	async getLinkStats(shortLink: string): Promise<ILinkStats | null> {
		const link = await this.getLinkByShortLink(shortLink)

		if (!link) throw new NotFoundException('Link not found')

		return link.linkStats ?? null
	}

	async generateQRCode(shortLink: string): Promise<GetQRCodeResponse> {
		const fullUrl = `${process.env.LINKS_SERVICE_URL}/links/redirect/${shortLink}`

		return QRCode.toBuffer(fullUrl, {
			scale: 16,
			color: { light: '#0000' },
		})
	}

	async deleteLinkById(linkId: number): Promise<ILink> {
		try {
			const deleted = await this.prismaService.link.delete({
				where: { id: linkId },
				include: {
					linkStats: {
						include: {
							linkRedirects: true,
						},
					},
				},
			})
			return deleted
		} catch (error) {
			if (error.code === 'P2025') throw new NotFoundException('Link not found')
			throw error
		}
	}

	async deleteUserLinks(userId: number): Promise<{ count: number }> {
		return await this.prismaService.link.deleteMany({
			where: { userId },
		})
	}

	async handleLinkRedirect(
		linkStatsId: number,
		userAgent?: string,
		ip?: string,
	): Promise<void> {
		const ua = userAgent ? useragent.parse(userAgent) : undefined
		const country = ip ? await this.geoIPService.getCountryByIP(ip) : undefined

		await this.prismaService.linkStats.update({
			where: { id: linkStatsId },
			data: {
				redirectsCount: { increment: 1 },
				linkRedirects: {
					create: {
						ip,
						country,
						browser: ua?.browser,
						os: ua?.os,
						device: ua?.platform,
						isMobile: ua?.isMobile,
						isTablet: ua?.isTablet,
						clickedAt: new Date(),
					},
				},
			},
		})
	}

	async migrateUserLinks(sourceUserId: number, targetUserId: number): Promise<void> {
		console.log(`Migrating links from user ${sourceUserId} to user ${targetUserId}`)

		const result = await this.prismaService.link.updateMany({
			where: { userId: sourceUserId },
			data: { userId: targetUserId },
		})

		console.log(`Migrated ${result.count} links between users`)
	}

	async getUserLinksStats(
		userId: number,
	): Promise<{ totalLinks: number; totalRedirects: number }> {
		const totalLinks = await this.prismaService.link.count({
			where: { userId },
		})

		const linksWithStats = await this.prismaService.link.findMany({
			where: { userId },
			include: {
				linkStats: {
					include: {
						linkRedirects: true,
					},
				},
			},
		})

		const totalRedirects = linksWithStats.reduce((sum, link) => {
			return sum + (link.linkStats?.redirectsCount || 0)
		}, 0)

		return { totalLinks, totalRedirects }
	}
}
