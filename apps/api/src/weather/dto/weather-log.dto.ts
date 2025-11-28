import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WeatherLogDto {
  @IsNotEmpty()
  _id: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  location_lat: string;

  @IsString()
  @IsNotEmpty()
  location_lon: string;

  @IsNumber()
  @IsNotEmpty()
  temperature_c: number;

  @IsNumber()
  @IsOptional()
  humidity_percent: number;

  @IsNumber()
  @IsOptional()
  wind_speed_kmh: number;

  @IsNumber()
  @IsOptional()
  weather_code: number;

  @IsNumber()
  @IsNotEmpty()
  collected_at: number;
}