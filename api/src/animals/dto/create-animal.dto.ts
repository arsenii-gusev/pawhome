import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AnimalStatus, Species } from '../animal.entity';

export class CreateAnimalDto {
  @ApiProperty({ example: 'Барсик' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: Species, example: Species.Cat })
  @IsEnum(Species)
  species: Species;

  @ApiPropertyOptional({ example: 'Британская короткошёрстная' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiProperty({ description: 'Возраст в месяцах', example: 18 })
  @IsInt()
  @Min(0)
  @Max(400)
  ageMonths: number;

  @ApiPropertyOptional({ example: 'Спокойный, любит людей, приучен к лотку' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/barsik.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ enum: AnimalStatus, default: AnimalStatus.Available })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;
}
