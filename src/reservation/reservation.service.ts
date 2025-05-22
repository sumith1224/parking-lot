import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { ParkingSpotService } from '../parking-spot/parking-spot.service';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationStatus } from './enums/reservation-status.enum';
import { Reservation } from './reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly userService: UserService,
    private readonly parkingSpotService: ParkingSpotService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const { startTime, endTime, parkingSpotId, userId } = createReservationDto;

    await this.userService.findOne(userId);

    const parkingSpot = await this.parkingSpotService.findOne(parkingSpotId);

    await this.validateTimeConstraints(startTime, endTime);

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const overlappingReservations = await transactionalEntityManager
        .createQueryBuilder(Reservation, 'reservation')
        .setLock('pessimistic_write')
        .where('reservation.parkingSpotId = :parkingSpotId', { parkingSpotId })
        .andWhere('reservation.status = :status', {
          status: ReservationStatus.CONFIRMED,
        })
        .andWhere(
          '(reservation.startTime <= :endTime AND reservation.endTime >= :startTime)',
          { startTime, endTime },
        )
        .getMany();

      if (overlappingReservations.length > 0) {
        throw new ConflictException(
          'The parking spot is already reserved for the requested time window',
        );
      }

      const reservation = transactionalEntityManager.create(Reservation, {
        startTime,
        endTime,
        parkingSpotId,
        userId,
        status: ReservationStatus.CONFIRMED,
      });

      return transactionalEntityManager.save(reservation);
    });
  }

  findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['user', 'parkingSpot', 'parkingSpot.parkingLot'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['user', 'parkingSpot', 'parkingSpot.parkingLot'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    await this.userService.findOne(userId);
    return this.reservationRepository.find({
      where: {
        userId,
        status: ReservationStatus.CONFIRMED,
        startTime: MoreThanOrEqual(new Date()),
      },
      relations: ['parkingSpot', 'parkingSpot.parkingLot'],
      order: { startTime: 'ASC' },
    });
  }

  async cancel(id: string): Promise<void> {
    const reservation = await this.findOne(id);
    if (new Date(reservation.startTime) <= new Date()) {
      throw new BadRequestException(
        'Cannot cancel an ongoing or past reservation',
      );
    }
    reservation.status = ReservationStatus.CANCELLED;
    await this.reservationRepository.save(reservation);
  }

  private async validateTimeConstraints(
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      throw new BadRequestException(
        'Reservation start time must be in the future',
      );
    }

    if (end <= start) {
      throw new BadRequestException(
        'Reservation end time must be after start time',
      );
    }

    const maxDurationHours = 24;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours > maxDurationHours) {
      throw new BadRequestException(
        `Reservation duration cannot exceed ${maxDurationHours} hours`,
      );
    }
  }
}
