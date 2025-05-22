import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ParkingLotService } from './parking-lot.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateParkingLotDto } from './dtos/create-parking-lot.dto';
import { ParkingLot } from './parking-lot.entity';

@ApiTags('parking-lots')
@Controller('parking-lots')
export class ParkingLotController {
  constructor(private readonly parkingLotService: ParkingLotService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new parking lot' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parking lot created successfully',
  })
  create(
    @Body() createParkingLotDto: CreateParkingLotDto,
  ): Promise<ParkingLot> {
    return this.parkingLotService.create(createParkingLotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parking lots' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of parking lots' })
  findAll(): Promise<ParkingLot[]> {
    return this.parkingLotService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parking lot by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parking lot found' })
  findOne(@Param('id') id: string): Promise<ParkingLot> {
    return this.parkingLotService.findOne(id);
  }
}
