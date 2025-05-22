import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParkingLotDto } from './dtos/create-parking-lot.dto';
import { ParkingLot } from './parking-lot.entity';

@Injectable()
export class ParkingLotService {
  constructor(
    @InjectRepository(ParkingLot)
    private readonly parkingLotRepository: Repository<ParkingLot>,
  ) {}

  create(createParkingLotDto: CreateParkingLotDto): Promise<ParkingLot> {
    const parkingLot = this.parkingLotRepository.create(createParkingLotDto);
    return this.parkingLotRepository.save(parkingLot);
  }

  findAll(): Promise<ParkingLot[]> {
    return this.parkingLotRepository.find();
  }

  async findOne(id: string): Promise<ParkingLot> {
    const parkingLot = await this.parkingLotRepository.findOne({
      where: { id },
      relations: ['parkingSpots'],
    });

    if (!parkingLot) {
      throw new NotFoundException(`Parking lot with ID ${id} not found`);
    }

    return parkingLot;
  }
}
