import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { Reservation } from './reservation.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reservation created successfully',
  })
  create(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of reservations' })
  findAll(): Promise<Reservation[]> {
    return this.reservationService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reservations by user ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User reservations found',
  })
  findByUser(@Param('userId') userId: string): Promise<Reservation[]> {
    return this.reservationService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reservation found' })
  findOne(@Param('id') id: string): Promise<Reservation> {
    return this.reservationService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Reservation cancelled successfully',
  })
  cancel(@Param('id') id: string): Promise<void> {
    return this.reservationService.cancel(id);
  }
}
