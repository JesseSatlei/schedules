import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { HttpModule } from '@nestjs/axios';
import { MomentModule } from '@ccmos/nestjs-moment';

@Module({
  imports: [HttpModule, MomentModule.forRoot({
    tz: 'Asia/Taipei',

  }) ],
  controllers: [SchedulesController],
  providers: [SchedulesService]
})
export class SchedulesModule {}
