import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://localhost:27017/weather_db'),
    WeatherModule,
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
