import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email для регистрации',
    example: 'newuser@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль (минимум 6 символов)',
    example: 'SecurePass456!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
