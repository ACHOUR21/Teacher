import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({ example: '123456', description: 'TOTP code from authenticator app' })
  @IsString()
  @Length(6, 6)
  token: string;
}

export class DisableMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  token: string;

  @ApiProperty()
  @IsString()
  password: string;
}
