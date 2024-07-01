import {ChangeDetectorRef, Component} from '@angular/core';
import {State} from './enums/state.enum'
import {scan} from "./utils/scanner";
import {ScannerService} from "./services/scanner.service";
import {LogService} from "./services/log.service";
import {TokenData} from "./interfaces/token-data.interface";
import {Log} from "./interfaces/log.interface";
import {Status} from "./enums/status.enum";
import {parse} from "./utils/parser";
import {ParserService} from "./services/parser.service";

export enum SimulationContentType {
  OPEN,
  NORMAL,
  EXCESS,
  ABSENCE,
  OTHER
}
export interface SimulationContent {
  content: string;
  type: SimulationContentType;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  protected readonly Status = Status;
  protected readonly SimulationContentType = SimulationContentType;

  public state: State = State.START;

  protected inputText: string = "";
  protected outputText: string = "";
  protected optimizedOutputText: string = "";
  protected logs: Log[] = [];
  protected visibleLogs: Log[] = [];
  protected delay!: number;
  protected isLoggingEnabled: boolean = true;
  protected readonly State = State;
  protected simulationContents: SimulationContent[] = [];

  private headIndex: number = 0;
  private explorerIndex: number = 0;
  private tokens: TokenData[] = [];
  private parserSimulationContent: SimulationContent[] = [];

  constructor(
    private readonly scannerService: ScannerService,
    private readonly logService: LogService,
    private readonly parserService: ParserService,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {
    this.scannerService.headIndex.subscribe((headIndex) => {
      this.headIndex = headIndex;
      this.constructCompileSimulationContentForScanner();
    });
    this.scannerService.explorerIndex.subscribe((explorerIndex) => {
      this.explorerIndex = explorerIndex;
      this.constructCompileSimulationContentForScanner();
    });
    this.scannerService.token.subscribe((token) => {
      this.outputText += token.token + "\n";
      if (!!this.delay) {
        const outputLines = this.outputText.split("\n");
        this.optimizedOutputText = outputLines.slice(outputLines.length - 30).join("\n");
      }
    });
    this.parserService.derivation.subscribe((derivation) => {
      this.outputText += derivation + `\n\n`;
      if (!!this.delay) {
        const outputLines = this.outputText.split("\n");
        this.optimizedOutputText = outputLines.slice(outputLines.length - 20).join("\n");
      }
    });
    this.parserService.simulationContent.subscribe((simulationContent) => {
      if (this.parserSimulationContent.length > 0 && this.parserSimulationContent[this.parserSimulationContent.length - 1].type === SimulationContentType.OPEN) {
        this.parserSimulationContent.pop();
      }
      this.parserSimulationContent.push(simulationContent);
      this.constructCompileSimulationContentForParser();
    });
    this.logService.log.subscribe((log) => {
      if (this.isLoggingEnabled) {
        this.visibleLogs = [...this.logs, log].splice(this.logs.length - 29);
      }
      this.logs = [...this.logs, log];

      this._changeDetectorRef.detectChanges();

      const console = document.getElementById("console");
      if (console) {
          console.scrollTo({top: console.scrollHeight});
      }
    })
  }

  public async onControlButtonClicked() {
    this.logs = [];
    this.visibleLogs = [];
    this.outputText = "";

    if (this.state == State.SCAN_DONE) {
      this.state = State.PARSER_PROCESSING;
      await parse(this.tokens, this.parserService, this.logService, this.delay ?? 0);
      this.state = State.PARSE_DONE;
      return;
    }

    this.headIndex = -1;
    this.explorerIndex = -1;
    this.state = State.SCANNER_PROCESSING;

    const tokens: TokenData[] = await scan(this.inputText.replaceAll("\r", ""), this.scannerService, this.logService, this.delay ?? 0);
    this.outputText = tokens.map(td => td.token).join("\n");

    this.tokens = tokens;
    this.state = State.SCAN_DONE;
  }

  protected async onPaste() {
    if (this.state === State.START) {
      this.inputText = await navigator.clipboard.readText();
    }
  }

  protected onCopy() {
    navigator.clipboard.writeText(this.outputText);
  }

  protected getButtonText(): string {
    switch (this.state) {
      case State.START:
        return "Scan";
      case State.SCANNER_PROCESSING:
        return "Scanning";
      case State.SCAN_DONE:
        return "Parse";
      case State.PARSER_PROCESSING:
        return "Parsing";
      case State.PARSE_DONE:
        return "Done";
    }
  }

  private constructCompileSimulationContentForParser() {
    const outputTextArea = document.getElementById("output")!;

    this.simulationContents = [];
    this.parserSimulationContent.forEach(simulationContent => {
      if (this.simulationContents.length > 0 && this.simulationContents[this.simulationContents.length - 1].type === simulationContent.type) {
        this.simulationContents[this.simulationContents.length - 1].content += simulationContent.content;
      } else {
        this.simulationContents.push({...simulationContent})
      }
    })
    this._changeDetectorRef.detectChanges();

    const openPre = document.getElementsByClassName("open")[0];
    if (openPre) {
      openPre.scrollIntoView();
    }
    outputTextArea.scrollTo({top: outputTextArea.scrollHeight});
  }

  private constructCompileSimulationContentForScanner() {
    const outputTextArea = document.getElementById("output")!;

    this.simulationContents = [
      {
        content: this.inputText.substring(0, this.headIndex),
        type: SimulationContentType.NORMAL
      },
      {
        content: this.inputText.substring(this.headIndex, this.explorerIndex + 1),
        type: SimulationContentType.OPEN
      },
      {
        content: this.inputText.substring(this.explorerIndex + 1),
        type: SimulationContentType.OTHER
      }
    ]
    this._changeDetectorRef.detectChanges();

    const openPre = document.getElementsByClassName("open")[0]!;
    openPre.scrollIntoView();
    outputTextArea.scrollTo({top: outputTextArea.scrollHeight});
  }
}
