import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import { Controller } from '@nestjs/common'
import { Channel, Message } from 'amqplib'
import {
	type LinkRedirectEvent,
	type UserAccountsMergedEvent,
	type UserDeletedEvent,
	EEventPattern,
} from '@wo0zz1/url-shortener-shared'

import { LinksService } from 'src/links/links.service'

@Controller()
export class LinksEventHandler {
	constructor(private readonly linksService: LinksService) {}

	ack(context: RmqContext) {
		const channel = context.getChannelRef() as Channel
		const originalMsg = context.getMessage() as Message
		channel.ack(originalMsg)
	}

	nack(context: RmqContext) {
		const channel = context.getChannelRef() as Channel
		const originalMsg = context.getMessage() as Message
		channel.nack(originalMsg, false, true)
	}

	@EventPattern(EEventPattern.USER_DELETED)
	async handleUserDeleted(@Payload() data: UserDeletedEvent, @Ctx() context: RmqContext) {
		console.log('Received user deleted event:', data)

		try {
			const { count } = await this.linksService.deleteUserLinks(data.userId)
			console.log(`Successfully deleted ${count} links for user ${data.userId}`)
			return this.ack(context)
		} catch (error) {
			console.error('Failed to delete user links:', error)
			return this.nack(context)
		}
	}

	@EventPattern(EEventPattern.USER_ACCOUNTS_MERGED)
	async handleUserAccountsMerged(
		@Payload() data: UserAccountsMergedEvent,
		@Ctx() context: RmqContext,
	) {
		console.log('Received accounts merged event:', data)

		try {
			await this.linksService.migrateUserLinks(data.sourceUserId, data.targetUserId)
			console.log(
				`Successfully migrated user links from user ${data.sourceUserId} to user ${data.targetUserId}`,
			)
			return this.ack(context)
		} catch (error) {
			console.error('Failed to migrate user links:', error)
			return this.nack(context)
		}
	}

	@EventPattern(EEventPattern.LINK_REDIRECT)
	async handleUserLinkRedirect(
		@Payload() data: LinkRedirectEvent,
		@Ctx() context: RmqContext,
	) {
		console.log('Received link redirect event:', data)

		try {
			await this.linksService.handleLinkRedirect(data.linkId, data.userAgent, data.ip)
			console.log('Successfully handled link redirect')
			return this.ack(context)
		} catch (error) {
			console.error('Failed to handle link redirect:', error)
			return this.nack(context)
		}
	}
}
