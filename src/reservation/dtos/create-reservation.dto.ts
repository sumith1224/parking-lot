import { IsDate, IsNotEmpty, IsUUID, MinDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsAfter } from '../../common/decorators/is-after.decorator';

export class CreateReservationDto {
  @ApiProperty({ example: '2023-05-21T10:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), { message: 'Start time must be in the future' })
  startTime: Date;

  @ApiProperty({ example: '2023-05-21T12:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfter('startTime', { message: 'End time must be after start time' })
  endTime: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  parkingSpotId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
