import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLotService } from '../parking-lot/parking-lot.service';
import { TimeWindowDto } from '../common/dtos/time-window.dto';
import { CreateParkingSpotDto } from './dtos/create-parking-spot.dto';
import { SpotType } from './enums/spot-type.enum';
import { ParkingSpot } from './parking-spot.entity';
import { ReservationStatus } from '../reservation/enums/reservation-status.enum';

@Injectable()
export class ParkingSpotService {
  constructor(
    @InjectRepository(ParkingSpot)
    private readonly parkingSpotRepository: Repository<ParkingSpot>,
    private readonly parkingLotService: ParkingLotService,
  ) {}

  async create(
    createParkingSpotDto: CreateParkingSpotDto,
  ): Promise<ParkingSpot> {
    // Ensure parking lot exists
    await this.parkingLotService.findOne(createParkingSpotDto.parkingLotId);

    const parkingSpot = this.parkingSpotRepository.create(createParkingSpotDto);
    return this.parkingSpotRepository.save(parkingSpot);
  }

  findAll(): Promise<ParkingSpot[]> {
    return this.parkingSpotRepository.find({
      relations: ['parkingLot'],
    });
  }

  async findOne(id: string): Promise<ParkingSpot> {
    const parkingSpot = await this.parkingSpotRepository.findOne({
      where: { id },
      relations: ['parkingLot'],
    });

    if (!parkingSpot) {
      throw new NotFoundException(`Parking spot with ID ${id} not found`);
    }

    return parkingSpot;
  }

  async findAvailable(
    timeWindow: TimeWindowDto,
    parkingLotId?: string,
    spotType?: SpotType,
  ): Promise<ParkingSpot[]> {
    const { startTime, endTime } = timeWindow;

    // Validate the time window
    if (new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Get spots that don't have overlapping reservations
    const query = this.parkingSpotRepository
      .createQueryBuilder('ps')
      .leftJoin('ps.reservations', 'r')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('reservations', 'r')
          .where('r.parkingSpotId = ps.id')
          .andWhere('r.status = :status', {
            status: ReservationStatus.CONFIRMED,
          })
          .andWhere('r.startTime < :endTime')
          .andWhere('r.endTime > :startTime')
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .setParameter('startTime', startTime)
      .setParameter('endTime', endTime);

    // Add filter by parking lot if provided
    if (parkingLotId) {
      query.andWhere('ps.parkingLotId = :parkingLotId', { parkingLotId });
    }

    // Add filter by spot type if provided
    if (spotType) {
      query.andWhere('ps.type = :spotType', { spotType });
    }

    return query.getMany();
  }
}
