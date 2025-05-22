import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ParkingSpotService } from './parking-spot.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TimeWindowDto } from '../common/dtos/time-window.dto';
import { CreateParkingSpotDto } from './dtos/create-parking-spot.dto';
import { SpotType } from './enums/spot-type.enum';
import { ParkingSpot } from './parking-spot.entity';

@ApiTags('parking-spots')
@Controller('parking-spots')
export class ParkingSpotController {
  constructor(private readonly parkingSpotService: ParkingSpotService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new parking spot' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parking spot created successfully',
  })
  create(
    @Body() createParkingSpotDto: CreateParkingSpotDto,
  ): Promise<ParkingSpot> {
    return this.parkingSpotService.create(createParkingSpotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parking spots' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of parking spots' })
  findAll(): Promise<ParkingSpot[]> {
    return this.parkingSpotService.findAll();
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all parking spot types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of spot types' })
  getSpotTypes() {
    return Object.values(SpotType);
  }

  @Get('available')
  @ApiOperation({ summary: 'Find available parking spots for a time window' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of available parking spots',
  })
  findAvailableSpots(
    @Query() timeWindow: TimeWindowDto,
    @Query('parkingLotId') parkingLotId?: string,
    @Query('type') spotType?: SpotType,
  ): Promise<ParkingSpot[]> {
    return this.parkingSpotService.findAvailable(
      timeWindow,
      parkingLotId,
      spotType,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parking spot by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parking spot found' })
  findOne(@Param('id') id: string): Promise<ParkingSpot> {
    return this.parkingSpotService.findOne(id);
  }
}
