import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ParkingSpotService } from './parking-spot.service';
import { ParkingSpot } from './parking-spot.entity';
import { ParkingLotService } from '../parking-lot/parking-lot.service';
import { SpotType } from './enums/spot-type.enum';

describe('ParkingSpotService', () => {
  let service: ParkingSpotService;
  let parkingSpotRepository: Repository<ParkingSpot>;
  let parkingLotService: ParkingLotService;

  const mockParkingSpot = {
    id: '1',
    spotNumber: 'A1',
    type: SpotType.STANDARD,
    parkingLotId: 'lot-1',
  };

  const mockParkingLotService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingSpotService,
        {
          provide: getRepositoryToken(ParkingSpot),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              setParameter: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: ParkingLotService,
          useValue: mockParkingLotService,
        },
      ],
    }).compile();

    service = module.get<ParkingSpotService>(ParkingSpotService);
    parkingSpotRepository = module.get<Repository<ParkingSpot>>(
      getRepositoryToken(ParkingSpot),
    );
    parkingLotService = module.get<ParkingLotService>(ParkingLotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createParkingSpotDto = {
      spotNumber: 'A1',
      type: SpotType.STANDARD,
      parkingLotId: 'lot-1',
    };

    it('should create a parking spot successfully', async () => {
      jest
        .spyOn(parkingLotService, 'findOne')
        .mockResolvedValue({ id: 'lot-1' } as any);
      jest
        .spyOn(parkingSpotRepository, 'create')
        .mockReturnValue(mockParkingSpot as any);
      jest
        .spyOn(parkingSpotRepository, 'save')
        .mockResolvedValue(mockParkingSpot as any);

      const result = await service.create(createParkingSpotDto);

      expect(result).toEqual(mockParkingSpot);
      expect(parkingLotService.findOne).toHaveBeenCalledWith('lot-1');
      expect(parkingSpotRepository.create).toHaveBeenCalledWith(
        createParkingSpotDto,
      );
      expect(parkingSpotRepository.save).toHaveBeenCalledWith(mockParkingSpot);
    });

    it('should throw NotFoundException when parking lot does not exist', async () => {
      jest
        .spyOn(parkingLotService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(service.create(createParkingSpotDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all parking spots', async () => {
      const mockParkingSpots = [mockParkingSpot];
      jest
        .spyOn(parkingSpotRepository, 'find')
        .mockResolvedValue(mockParkingSpots as any);

      const result = await service.findAll();

      expect(result).toEqual(mockParkingSpots);
      expect(parkingSpotRepository.find).toHaveBeenCalledWith({
        relations: ['parkingLot'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a parking spot by id', async () => {
      jest
        .spyOn(parkingSpotRepository, 'findOne')
        .mockResolvedValue(mockParkingSpot as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockParkingSpot);
      expect(parkingSpotRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['parkingLot'],
      });
    });

    it('should throw NotFoundException when parking spot is not found', async () => {
      jest.spyOn(parkingSpotRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAvailable', () => {
    const timeWindow = {
      startTime: new Date('2024-03-20T10:00:00Z'),
      endTime: new Date('2024-03-20T12:00:00Z'),
    };

    it('should return available parking spots for a time window', async () => {
      const mockParkingSpots = [mockParkingSpot];
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockParkingSpots),
      };
      jest
        .spyOn(parkingSpotRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.findAvailable(timeWindow);

      expect(result).toEqual(mockParkingSpots);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'ps.reservations',
        'r',
      );
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'startTime',
        timeWindow.startTime,
      );
      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'endTime',
        timeWindow.endTime,
      );
    });

    it('should throw BadRequestException when start time is after end time', async () => {
      const invalidTimeWindow = {
        startTime: new Date('2024-03-20T12:00:00Z'),
        endTime: new Date('2024-03-20T10:00:00Z'),
      };

      await expect(service.findAvailable(invalidTimeWindow)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should filter by parking lot id when provided', async () => {
      const mockParkingSpots = [mockParkingSpot];
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockParkingSpots),
      };
      jest
        .spyOn(parkingSpotRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await service.findAvailable(timeWindow, 'lot-1');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'ps.parkingLotId = :parkingLotId',
        { parkingLotId: 'lot-1' },
      );
    });

    it('should filter by spot type when provided', async () => {
      const mockParkingSpots = [mockParkingSpot];
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockParkingSpots),
      };
      jest
        .spyOn(parkingSpotRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await service.findAvailable(timeWindow, undefined, SpotType.STANDARD);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'ps.type = :spotType',
        { spotType: SpotType.STANDARD },
      );
    });
  });
});
