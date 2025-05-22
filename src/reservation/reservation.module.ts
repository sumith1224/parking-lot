import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { UserModule } from '../user/user.module';
import { ParkingSpotModule } from '../parking-spot/parking-spot.module';
import { Reservation } from './reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    UserModule,
    ParkingSpotModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
