import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Response } from 'express';
import { CreateWeaterLogDto } from './dto/create-weather-log.dto';
import { WeatherLogDto } from './dto/weather-log.dto';
import { WeatherLogDocument } from './schemas/weather-log.schema';
import { WeatherService } from './weather.service';

@Controller('/api/weather')
@UsePipes(new ValidationPipe({ transform: true }))
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name)

  constructor(private readonly weatherService: WeatherService) { }

  @Post("logs")
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createWeatherLog: CreateWeaterLogDto) {
    this.logger.log(`Recebendo log de clima: ${createWeatherLog.temperature_c}°C`);
    const savedLog = await this.weatherService.create(createWeatherLog);
    this.logger.log(`Log salvo com ID: ${savedLog._id}`);
    return {
      message: 'Log de clima recebido e salvo',
      id: savedLog._id
    };
  }

  @Get("logs")
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const result = await this.weatherService.getAll(Number(page), Number(limit));
    return {
      ...result,
      data: result.data.map(this.mapWeatherLogToDto),
    };
  }

  @Get('/weather.csv')
  @HttpCode(HttpStatus.OK)
  async exportCsv(@Query('page') page = 1, @Query('limit') limit = 100, @Res() res: Response) {
    const csv = await this.weatherService.exportCsv(Number(page), Number(limit));
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="weather_logs.csv"');
    res.send(csv);
  }

  @Get('/weather.xlsx')
  @HttpCode(HttpStatus.OK)
  async exportXlsx(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Res() res: Response
  ) {
    const xlsxBuffer = await this.weatherService.exportXlsx(Number(page), Number(limit));
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename="weather_logs.xlsx"');
    res.send(xlsxBuffer);
  }

  private mapWeatherLogToDto(log: WeatherLogDocument): WeatherLogDto {
    return {
      _id: String(log._id),
      timestamp: log.timestamp,
      location_lat: log.location_lat,
      location_lon: log.location_lon,
      temperature_c: log.temperature_c,
      humidity_percent: log.humidity_percent,
      wind_speed_kmh: log.wind_speed_kmh,
      weather_code: log.weather_code,
      collected_at: log.collected_at,
    };
  }

  private mapCreateWeatherLogToEntity(log: CreateWeaterLogDto): WeatherLogDocument {
    return {
      timestamp: log.timestamp,
      location_lat: log.location_lat,
      location_lon: log.location_lon,
      temperature_c: log.temperature_c,
      humidity_percent: log.humidity_percent,
      wind_speed_kmh: log.wind_speed_kmh,
      weather_code: log.weather_code,
      collected_at: log.collected_at,
    } as WeatherLogDocument;
  }
}