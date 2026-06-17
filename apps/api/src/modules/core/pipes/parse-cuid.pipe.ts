import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  // CUID pattern: starts with 'c' followed by 24 alphanumeric chars
  private readonly CUID_REGEX = /^c[a-z0-9]{24}$/i;

  transform(value: string): string {
    if (!value || !this.CUID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid ID format: ${value}`);
    }
    return value;
  }
}
