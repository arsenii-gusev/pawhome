import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateAdoptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  animalId: string;

  @ApiProperty({
    example: 'Живу в частном доме с огороженным двором, есть опыт содержания собак.',
    minLength: 10,
  })
  @IsString()
  @Length(10, 1000)
  message: string;
}
