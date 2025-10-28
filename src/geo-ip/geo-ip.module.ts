import { Module } from '@nestjs/common'

import { HttpModule } from '@nestjs/axios'

import { GeoIPService } from './geo-ip.service'

@Module({
	imports: [HttpModule],
	providers: [GeoIPService],
	exports: [GeoIPService],
})
export class GeoIPModule {}
