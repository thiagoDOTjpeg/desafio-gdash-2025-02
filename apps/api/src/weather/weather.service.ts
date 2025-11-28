import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Parser } from 'json2csv';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { CreateWeaterLogDto } from './dto/create-weather-log.dto';
import { WeatherLog, WeatherLogDocument } from './schemas/weather-log.schema';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(WeatherLog.name)
    private weatherLogModel: Model<WeatherLogDocument>,
  ) { }

  async create(log: CreateWeaterLogDto): Promise<WeatherLogDocument> {
    return this.weatherLogModel.create(log);
  }

  async getAll(page = 1, limit = 10): Promise<{
    data: WeatherLogDocument[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.weatherLogModel.find().sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      this.weatherLogModel.countDocuments().exec(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async exportCsv(page = 1, limit = 100): Promise<string> {
    const skip = (page - 1) * limit;
    const logs = await this.weatherLogModel.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    const parser = new Parser();
    return parser.parse(logs);
  }

  async exportXlsx(page = 1, limit = 100): Promise<Buffer> {
    const skip = (page - 1) * limit;
    const logs = await this.weatherLogModel.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WeatherLogs');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
