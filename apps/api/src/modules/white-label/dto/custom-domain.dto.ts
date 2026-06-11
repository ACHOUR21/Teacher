import { IsString, IsFQDN } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomDomainDto {
  @ApiProperty({ example: 'school.example.com' })
  @IsString()
  @IsFQDN()
  domain: string;
}
