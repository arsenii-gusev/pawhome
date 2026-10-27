import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AdoptionStatus } from '../adoption-request.entity';

export class QueryAdoptionsDto {
  @ApiPropertyOptional({ enum: AdoptionStatus })
  @IsOptional()
  @IsEnum(AdoptionStatus)
  status?: AdoptionStatus;
}
