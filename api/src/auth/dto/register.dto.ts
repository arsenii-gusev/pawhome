import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'anna@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Анна' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ minLength: 8, example: 'secret123' })
  @IsString()
  @Length(8, 72)
  password: string;
}
