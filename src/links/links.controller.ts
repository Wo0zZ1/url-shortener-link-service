import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Query,
	Res,
	Req,
	ParseIntPipe,
	NotFoundException,
	UseGuards,
} from '@nestjs/common'
import {
	CreateLinkDto,
	GatewaySecretGuard,
	RedirectResponse,
	GetUserLinksResponse,
	CreateLinkResponse,
	GetLinkByShortLinkResponse,
	DeleteLinkResponse,
	DeleteUserLinksResponse,
	GetLinkStatsResponse,
	GetQRCodeResponse,
	GetUserLinksStatsResponse,
} from '@wo0zz1/url-shortener-shared'

import { type Response, type Request } from 'express'
import { LinksService } from './links.service'

@Controller('links')
export class LinksController {
	constructor(private readonly linksService: LinksService) {}

	@Get('/redirect/:shortLink')
	async redirect(
		@Param('shortLink') shortLink: string,
		@Req() request: Request,
	): Promise<RedirectResponse> {
		const userAgent = request.headers['user-agent']
		const ip = request.ip || request.headers['x-forwarded-for']

		const targetUrl = await this.linksService.redirect(shortLink, userAgent, ip as string)

		return { url: targetUrl }
	}

	@UseGuards(GatewaySecretGuard)
	@Get('user/:userId')
	getUserLinks(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	): Promise<GetUserLinksResponse> {
		return this.linksService.getUserLinks(userId, page, limit)
	}

	@UseGuards(GatewaySecretGuard)
	@Post('user/:userId')
	createLink(
		@Param('userId', ParseIntPipe) userId: number,
		@Body() createLinkDto: CreateLinkDto,
	): Promise<CreateLinkResponse> {
		return this.linksService.createLink(userId, createLinkDto)
	}

	@UseGuards(GatewaySecretGuard)
	@Delete('user/:userId')
	async deleteUserLinks(
		@Param('userId', ParseIntPipe) userId: number,
	): Promise<DeleteUserLinksResponse> {
		return this.linksService.deleteUserLinks(userId)
	}

	@UseGuards(GatewaySecretGuard)
	@Get('/id/:shortLink')
	async getLinkInfo(
		@Param('shortLink') shortLink: string,
	): Promise<GetLinkByShortLinkResponse> {
		const link = await this.linksService.getLinkByShortLink(shortLink)
		if (!link) throw new NotFoundException('Link not found')
		return link
	}

	@UseGuards(GatewaySecretGuard)
	@Delete(':shortLink')
	async deleteLink(@Param('shortLink') shortLink: string): Promise<DeleteLinkResponse> {
		const link = await this.linksService.getLinkByShortLink(shortLink)
		if (!link) throw new NotFoundException('Link not found')

		return this.linksService.deleteLinkById(link.id)
	}

	@UseGuards(GatewaySecretGuard)
	@Get(':shortLink/stats')
	async getLinkStats(
		@Param('shortLink') shortLink: string,
	): Promise<GetLinkStatsResponse> {
		const link = await this.linksService.getLinkByShortLink(shortLink)
		if (!link) throw new NotFoundException('Link not found')
		if (!link.linkStats) throw new NotFoundException('Link statistics not found')

		return link.linkStats
	}

	@UseGuards(GatewaySecretGuard)
	@Get(':shortLink/qr')
	async getQRCode(
		@Param('shortLink') shortLink: string,
		@Res() response: Response,
	): Promise<void> {
		const link = await this.linksService.getLinkByShortLink(shortLink)
		if (!link) throw new NotFoundException('Link not found')

		const qrBuffer: GetQRCodeResponse = await this.linksService.generateQRCode(shortLink)

		response.setHeader('Content-Type', 'image/png')
		response.setHeader(
			'Content-Disposition',
			`attachment; filename="QR_${shortLink}.png"`,
		)

		response.send(qrBuffer)
	}

	@UseGuards(GatewaySecretGuard)
	@Get('user/:userId/stats')
	getUserLinksStats(
		@Param('userId', ParseIntPipe) userId: number,
	): Promise<GetUserLinksStatsResponse> {
		return this.linksService.getUserLinksStats(userId)
	}
}
