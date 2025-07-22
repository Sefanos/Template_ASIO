import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'safeString' })
export class SafeStringPipe implements PipeTransform {
  transform(value: string | undefined): string {
    return typeof value === 'string' ? value : '';
  }
}
