import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token для авторизации',
    example: 'eyJhbGciO...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Данные пользователя',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
