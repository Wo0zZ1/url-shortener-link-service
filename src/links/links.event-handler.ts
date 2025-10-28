import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import { Controller } from '@nestjs/common'
import { Channel, Message } from 'amqplib'
import {
	type LinkRedirectEvent,
	type LinkMigratedEvent,
	EEventPattern,
} from '@wo0zz1/url-shortener-shared'

import { LinksService } from 'src/links/links.service'

@Controller()
export class LinksEventHandler {
	constructor(private readonly linksService: LinksService) {}

	@EventPattern(EEventPattern.LINK_MIGRATED)
	async handleUserLinkMigrated(
		@Payload() data: LinkMigratedEvent,
		@Ctx() context: RmqContext,
	) {
		console.log('LinksService: Received link migration event:', data)
		const channel = context.getChannelRef() as Channel
		const originalMsg = context.getMessage() as Message

		try {
			await this.linksService.migrateUserLinks(data.sourceUserId, data.targetUserId)
			channel.ack(originalMsg)
			console.log('Successfully migrated user links')
		} catch (error) {
			channel.nack(originalMsg, false, true)
			console.error('Failed to migrate user links:', error)
		}
	}

	@EventPattern(EEventPattern.LINK_REDIRECT)
	async handleUserLinkRedirect(
		@Payload() data: LinkRedirectEvent,
		@Ctx() context: RmqContext,
	) {
		console.log('LinksService: Received link redirect event:', data)
		const channel = context.getChannelRef() as Channel
		const originalMsg = context.getMessage() as Message

		try {
			await this.linksService.handleLinkRedirect(
				data.linkStatsId,
				data.userAgent,
				data.ip,
			)
			channel.ack(originalMsg)
			console.log('Successfully handled link redirect')
		} catch (error) {
			channel.nack(originalMsg, false, true)
			console.error('Failed to migrate user links:', error)
		}
	}
}
