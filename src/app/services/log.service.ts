import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {Log} from "../interfaces/log.interface";
import {Status} from "../enums/status.enum";

@Injectable({
  providedIn: 'root'
})
export class LogService {
  public log: Subject<Log> = new Subject<Log>();
}
