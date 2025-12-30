import {
  NumberField,
  NumberFieldOptional,
} from '@/decorators/field.decorators';
import { Max, Min } from 'class-validator';

export class FindDriversDto {
  @NumberField()
  @Min(-90)
  @Max(90)
  lat: number;

  @NumberField()
  @Min(-180)
  @Max(180)
  lng: number;

  @NumberFieldOptional()
  @Min(0.1)
  @Max(100) // Enterprise limit: Don't let users scan the whole world (perf protection)
  radiusKm?: number = 5; // Default value
}
