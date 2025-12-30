import { NumberField, StringField } from '@/decorators/field.decorators';

export class DriverLocationResDto {
  @StringField()
  driverId: string;

  @NumberField()
  distanceKm: number;
}
