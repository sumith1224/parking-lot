import { IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SpotType } from '../enums/spot-type.enum';

export class CreateParkingSpotDto {
  @ApiProperty({ example: 'A-123' })
  @IsNotEmpty()
  @IsString()
  spotNumber: string;

  @ApiProperty({ enum: SpotType, example: SpotType.STANDARD })
  @IsNotEmpty()
  @IsEnum(SpotType)
  type: SpotType;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  parkingLotId: string;
}
