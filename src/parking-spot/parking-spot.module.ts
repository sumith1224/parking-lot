import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSpotService } from './parking-spot.service';
import { ParkingSpotController } from './parking-spot.controller';
import { ParkingLotModule } from '../parking-lot/parking-lot.module';
import { ParkingSpot } from './parking-spot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParkingSpot]),
    ParkingLotModule, // Import to use ParkingLotService
  ],
  controllers: [ParkingSpotController],
  providers: [ParkingSpotService],
  exports: [ParkingSpotService],
})
export class ParkingSpotModule {}
