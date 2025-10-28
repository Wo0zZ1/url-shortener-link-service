import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class GeoIPService {
	private readonly logger = new Logger(GeoIPService.name)
	private readonly IP_API_URL = 'http://ipapi.co'

	constructor(private readonly httpService: HttpService) {}

	async getCountryByIP(ip: string): Promise<string | undefined> {
		if (this.isPrivateIP(ip) || ip === 'unknown' || ip === '127.0.0.1') return 'Local'

		try {
			const response = await firstValueFrom(
				this.httpService.get(`${this.IP_API_URL}/${ip}/country/`, {
					timeout: 5000,
				}),
			)

			return response.data?.trim()
		} catch (error) {
			this.logger.warn(`Failed to get country for IP ${ip}: ${error.message}`)
		}
	}

	private isPrivateIP(ip: string): boolean {
		return (
			ip.startsWith('::1:') ||
			ip.startsWith('10.') ||
			ip.startsWith('192.168.') ||
			ip.startsWith('172.') ||
			ip.startsWith('localhost') ||
			ip.startsWith('http://localhost')
		)
	}
}
