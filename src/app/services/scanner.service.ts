import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {TokenData} from "../interfaces/token-data.interface";
import {TokenExtractionData} from "../interfaces/token-extraction-data.interface";

@Injectable({
  providedIn: 'root'
})
export class ScannerService {
  public explorerIndex: Subject<number> = new Subject<number>();
  public headIndex: Subject<number> =  new Subject<number>();
  public token: Subject<TokenData> =  new Subject<TokenData>();
}
