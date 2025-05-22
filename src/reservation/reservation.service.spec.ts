import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Reservation } from './reservation.entity';
import { UserService } from '../user/user.service';
import { ParkingSpotService } from '../parking-spot/parking-spot.service';
import { ReservationStatus } from './enums/reservation-status.enum';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: Repository<Reservation>;
  let userService: UserService;
  let parkingSpotService: ParkingSpotService;
  let dataSource: DataSource;

  // Helper function to create future dates
  const createFutureDate = (hoursFromNow: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hoursFromNow);
    return date;
  };

  const mockReservation = {
    id: '1',
    startTime: createFutureDate(2), // 2 hours from now
    endTime: createFutureDate(4), // 4 hours from now
    status: ReservationStatus.CONFIRMED,
    userId: 'user-1',
    parkingSpotId: 'spot-1',
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockParkingSpotService = {
    findOne: jest.fn(),
  };

  const createMockTransaction = () => ({
    createQueryBuilder: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockReturnValue(mockReservation),
    save: jest.fn().mockResolvedValue(mockReservation),
  });

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((callback) => {
      const mockTransaction = createMockTransaction();
      return callback(mockTransaction);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ParkingSpotService,
          useValue: mockParkingSpotService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepository = module.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    userService = module.get<UserService>(UserService);
    parkingSpotService = module.get<ParkingSpotService>(ParkingSpotService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createReservationDto = {
      startTime: createFutureDate(2), // 2 hours from now
      endTime: createFutureDate(4), // 4 hours from now
      parkingSpotId: 'spot-1',
      userId: 'user-1',
    };

    it('should create a reservation successfully', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ id: 'user-1' } as any);
      jest
        .spyOn(parkingSpotService, 'findOne')
        .mockResolvedValue({ id: 'spot-1' } as any);

      const result = await service.create(createReservationDto);

      expect(result).toEqual(mockReservation);
      expect(userService.findOne).toHaveBeenCalledWith('user-1');
      expect(parkingSpotService.findOne).toHaveBeenCalledWith('spot-1');
    });

    it('should throw BadRequestException when start time is in the past', async () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      await expect(
        service.create({
          ...createReservationDto,
          startTime: pastTime,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const startTime = createFutureDate(4); // 4 hours from now
      const endTime = createFutureDate(2); // 2 hours from now

      await expect(
        service.create({
          ...createReservationDto,
          startTime,
          endTime,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when spot is already reserved', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ id: 'user-1' } as any);
      jest
        .spyOn(parkingSpotService, 'findOne')
        .mockResolvedValue({ id: 'spot-1' } as any);

      const mockTransaction = createMockTransaction();
      mockTransaction.getMany.mockResolvedValue([
        { id: 'existing-reservation' },
      ]);

      // Override the transaction mock for this specific test
      (dataSource.transaction as jest.Mock).mockImplementationOnce(
        (callback) => {
          return callback(mockTransaction);
        },
      );

      await expect(service.create(createReservationDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all reservations', async () => {
      const mockReservations = [mockReservation];
      jest
        .spyOn(reservationRepository, 'find')
        .mockResolvedValue(mockReservations as any);

      const result = await service.findAll();

      expect(result).toEqual(mockReservations);
      expect(reservationRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'parkingSpot', 'parkingSpot.parkingLot'],
        order: { startTime: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      jest
        .spyOn(reservationRepository, 'findOne')
        .mockResolvedValue(mockReservation as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockReservation);
      expect(reservationRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['user', 'parkingSpot', 'parkingSpot.parkingLot'],
      });
    });

    it('should throw NotFoundException when reservation is not found', async () => {
      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return reservations for a user', async () => {
      const mockReservations = [mockReservation];
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue({ id: 'user-1' } as any);
      jest
        .spyOn(reservationRepository, 'find')
        .mockResolvedValue(mockReservations as any);

      const result = await service.findByUser('user-1');

      expect(result).toEqual(mockReservations);
      expect(userService.findOne).toHaveBeenCalledWith('user-1');
      expect(reservationRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: ReservationStatus.CONFIRMED,
          startTime: expect.any(Object),
        },
        relations: ['parkingSpot', 'parkingSpot.parkingLot'],
        order: { startTime: 'ASC' },
      });
    });
  });

  describe('cancel', () => {
    it('should cancel a reservation', async () => {
      const futureReservation = {
        id: '1',
        startTime: createFutureDate(2), // 2 hours from now
        status: ReservationStatus.CONFIRMED,
      };

      jest
        .spyOn(reservationRepository, 'findOne')
        .mockResolvedValue(futureReservation as any);
      jest.spyOn(reservationRepository, 'save').mockResolvedValue({
        ...futureReservation,
        status: ReservationStatus.CANCELLED,
      } as any);

      await service.cancel('1');

      expect(reservationRepository.save).toHaveBeenCalledWith({
        ...futureReservation,
        status: ReservationStatus.CANCELLED,
      });
    });

    it('should throw BadRequestException when trying to cancel an ongoing reservation', async () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue({
        id: '1',
        startTime: pastTime,
      } as any);

      await expect(service.cancel('1')).rejects.toThrow(BadRequestException);
    });
  });
});
