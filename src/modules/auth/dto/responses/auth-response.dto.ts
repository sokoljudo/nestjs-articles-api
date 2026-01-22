import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token для авторизации',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YzUzYzlkOC1hMzY1LTQ0HbQtYjI2Ni1iZGI1OTI5ZjVkZjAiLCJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY5MDIwNjMxLCJleHAiOjE3NjkxMDcwMzF9.UPnYjDTDMeiPIpPeMB00_9wpAuN3crSj-UqUvF_YHFY',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Данные пользователя',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
