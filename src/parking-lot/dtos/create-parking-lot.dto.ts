import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParkingLotDto {
  @ApiProperty({ example: 'Downtown Parking' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, City, State' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 37.7749 })
  @IsNotEmpty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNotEmpty()
  @IsNumber()
  @IsLongitude()
  longitude: number;
}
