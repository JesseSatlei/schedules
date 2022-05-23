import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import { lastValueFrom } from 'rxjs';
import { ProfessionalDto } from '../dto/Professional.dto';
import { Schedules } from '../dto/schedules.dto';

@Injectable()
export class SchedulesService {

  constructor(
    private httpService: HttpService
  ) {
  }
  private readonly logger = new Logger(SchedulesService.name);

  async findAll() {
    const professionals = await this.getProfessionals();
    
    const availables = {};
    const ids = [];
    professionals.forEach(async (professional) => {
      professional.startsAt = moment(professional.startsAt, 'HH:mm');
      professional.finishesAt = moment(professional.finishesAt, 'HH:mm');
      ids.push(professional.id);
      while (professional.startsAt <= professional.finishesAt) {
        availables[professional.startsAt.format('HH:mm')] = 'available';
        professional.startsAt.add(30, 'm');
      }
    });

    return Object.assign(availables, await this.unavailable(ids));    
  }

  async unavailable(id: Array<number>) {
    const schedules = await Promise.all(id.map( async (i: number) => {
      const schedule = await this.getProfessionalSchedule(i);
      const t = {};
      schedule.forEach(({ startsAt, finishesAt }) => {
        startsAt = moment(startsAt, 'HH:mm');
        
        finishesAt = moment(finishesAt, 'HH:mm');
        while (startsAt < finishesAt) {
          t[startsAt.format('HH:mm')] = 'unavailable';
          
          startsAt.add(30, 'm');
        }
      });
      return t;
    }));

    return schedules.reduce((acc, val) => {    
      return { ...acc, ...val  };
    }, {});
  }

  @Cron('0 */30 8-18 * * *')
  async handleInterval() {
    const schedules = await this.findAll();
    console.log(schedules);    
    this.logger.debug(schedules);
  }

  async getProfessionals(): Promise<ProfessionalDto[]> {
    try {
      const { data } = await lastValueFrom(this.httpService.get(`https://api-homolog.geracaopet.com.br/api/challenges/challenge1/employees`));      
      return data.employees;
    } catch (error) {
      return [];
    }
  }

  async getProfessionalSchedule(id: number): Promise<Schedules[]> {
    try {
      const { data } = await lastValueFrom(this.httpService.get(`https://api-homolog.geracaopet.com.br/api/challenges/challenge1/employee/${id}/appointments`));      
      return data.appointments;
    } catch (error) {
      return [];
    }
  }

}