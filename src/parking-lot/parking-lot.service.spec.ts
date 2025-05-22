import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ParkingLotService } from './parking-lot.service';
import { ParkingLot } from './parking-lot.entity';

describe('ParkingLotService', () => {
  let service: ParkingLotService;
  let parkingLotRepository: Repository<ParkingLot>;

  const mockParkingLot = {
    id: '1',
    name: 'Test Parking Lot',
    address: '123 Test St',
    latitude: 37.7749,
    longitude: -122.4194,
    totalSpots: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingLotService,
        {
          provide: getRepositoryToken(ParkingLot),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParkingLotService>(ParkingLotService);
    parkingLotRepository = module.get<Repository<ParkingLot>>(
      getRepositoryToken(ParkingLot),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createParkingLotDto = {
      name: 'Test Parking Lot',
      address: '123 Test St',
      latitude: 37.7749,
      longitude: -122.4194,
      totalSpots: 100,
    };

    it('should create a parking lot successfully', async () => {
      jest
        .spyOn(parkingLotRepository, 'create')
        .mockReturnValue(mockParkingLot as any);
      jest
        .spyOn(parkingLotRepository, 'save')
        .mockResolvedValue(mockParkingLot as any);

      const result = await service.create(createParkingLotDto);

      expect(result).toEqual(mockParkingLot);
      expect(parkingLotRepository.create).toHaveBeenCalledWith(
        createParkingLotDto,
      );
      expect(parkingLotRepository.save).toHaveBeenCalledWith(mockParkingLot);
    });
  });

  describe('findAll', () => {
    it('should return all parking lots', async () => {
      const mockParkingLots = [mockParkingLot];
      jest
        .spyOn(parkingLotRepository, 'find')
        .mockResolvedValue(mockParkingLots as any);

      const result = await service.findAll();

      expect(result).toEqual(mockParkingLots);
      expect(parkingLotRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a parking lot by id', async () => {
      jest
        .spyOn(parkingLotRepository, 'findOne')
        .mockResolvedValue(mockParkingLot as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockParkingLot);
      expect(parkingLotRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['parkingSpots'],
      });
    });

    it('should throw NotFoundException when parking lot is not found', async () => {
      jest.spyOn(parkingLotRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
