import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeatherLogDocument = WeatherLog & Document;

@Schema({ collection: 'weather_logs' })
export class WeatherLog {
  @Prop({ required: true, index: true })
  timestamp: number;

  @Prop({ required: true })
  location_lat: string;

  @Prop({ required: true })
  location_lon: string;

  @Prop({ required: true })
  temperature_c: number;

  @Prop()
  humidity_percent: number;

  @Prop()
  wind_speed_kmh: number;

  @Prop()
  weather_code: number;

  @Prop({ required: true, index: true })
  collected_at: number;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);