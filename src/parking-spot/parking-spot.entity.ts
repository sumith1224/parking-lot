import { ParkingLot } from '../parking-lot/parking-lot.entity';
import { Reservation } from '../reservation/reservation.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SpotType } from './enums/spot-type.enum';

@Entity('parking_spots')
@Unique(['spotNumber', 'parkingLotId'])
export class ParkingSpot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  spotNumber: string;

  @Column({
    type: 'enum',
    enum: SpotType,
    default: SpotType.STANDARD,
  })
  type: SpotType;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.parkingSpots)
  @JoinColumn()
  parkingLot: ParkingLot;

  @Column()
  parkingLotId: string;

  @OneToMany(() => Reservation, (reservation) => reservation.parkingSpot)
  reservations: Reservation[];
}
