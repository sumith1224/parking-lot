import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsAfter } from '../../common/decorators/is-after.decorator';

export class TimeWindowDto {
  @ApiProperty({ example: '2023-05-21T10:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({ example: '2023-05-21T12:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfter('startTime')
  endTime: Date;
}
