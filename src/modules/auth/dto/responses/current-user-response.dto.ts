import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
  @ApiProperty({
    description: 'ID текущего пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Email текущего пользователя',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;
}
