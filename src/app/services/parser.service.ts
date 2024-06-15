import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {SimulationContent} from "../app.component";

@Injectable({
  providedIn: 'root'
})
export class ParserService {
  public simulationContent: Subject<SimulationContent> =  new Subject<SimulationContent>();
  public derivation: Subject<string> =  new Subject<string>();
}
