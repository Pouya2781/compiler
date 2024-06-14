import {Token} from '../enums/token.enum';
import {TokenExtractionData} from "../interfaces/token-extraction-data.interface";
import {TokenData} from "../interfaces/token-data.interface";
import {ScannerService} from "../services/scanner.service";
import {LogService} from "../services/log.service";
import {Status} from "../enums/status.enum";

const LOWERCASE_LETTERS: string = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_LETTERS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LETTERS: string = UPPERCASE_LETTERS + LOWERCASE_LETTERS;
const LETTERS_: string = LETTERS + '_';
const DIGITS: string = '0123456789';

async function getId(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (includes(LETTERS_, c)) state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Id, index: startIndex, value}, index: index - 1};
        break;
    }
    value += c;
    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getDecimal(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (includes(DIGITS, c)) {
          if (c != "0") state = 2;
          else state = 3;
        }
        else if (c == "+" || c == "-") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (includes(DIGITS, c)) {
          if (c != "0") state = 2;
          else state = 3;
        } else return fail(startIndex);
        break;
      case 2:
        if (!includes(DIGITS, c)) return {tokenData: {token: Token.T_Decimal, index: startIndex, value}, index: index - 1};
        break;
      case 3:
        if (!includes(DIGITS, c)) return {tokenData: {token: Token.T_Decimal, index: startIndex, value}, index: index - 1};
        else return fail(startIndex);
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getHexadecimal(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == "0") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == "x" || c == "X") state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (includes(DIGITS, c) || includes("abcdefABCDEF", c)) state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (!(includes(DIGITS, c) || includes("abcdefABCDEF", c))) return {tokenData: {token: Token.T_Hexadecimal, index: startIndex, value}, index: index - 1};
        break;
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getCharacter(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == "'") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == "'") return {tokenData: {token: Token.T_Character, index: startIndex, value}, index};
        if (c == "\\") state = 2;
        else state = 3;
        break;
      case 2:
        state = 3;
        break;
      case 3:
        if (c == "'") return {tokenData: {token: Token.T_Character, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getString(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == "\"") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == "\"") return {tokenData: {token: Token.T_String, index: startIndex, value}, index};
        if (c == "\n" || c == "") return fail(startIndex);
        if (c == "\\") state = 2;
        break;
      case 2:
        state = 1;
        break;
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getComment(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == "/") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == "/") state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == "\n" || c == "") return {tokenData: {token: Token.T_Comment, index: startIndex, value}, index};
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getWhitespace(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == "\t" || c == "\n" || c == " ") state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (!(c == "\t" || c == "\n" || c == " ")) return {tokenData: {token: Token.T_Whitespace, index: startIndex, value}, index: index - 1};
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getBool(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'b') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'o') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'o') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'l') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Bool, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getBreak(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'b') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'r') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'e') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'a') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (c == 'k') state = 5;
        else return fail(startIndex);
        break;
      case 5:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Break, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getChar(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'c') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'h') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'a') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'r') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Char, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getContinue(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'c') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'o') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'n') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 't') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (c == 'i') state = 5;
        else return fail(startIndex);
        break;
      case 5:
        if (c == 'n') state = 6;
        else return fail(startIndex);
        break;
      case 6:
        if (c == 'u') state = 7;
        else return fail(startIndex);
        break;
      case 7:
        if (c == 'e') state = 8;
        else return fail(startIndex);
        break;
      case 8:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Continue, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getElse(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'e') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'l') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 's') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'e') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Else, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getFalse(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'f') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'a') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'l') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 's') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (c == 'e') state = 5;
        else return fail(startIndex);
        break;
      case 5:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_False, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getFor(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'f') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'o') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'r') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_For, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getIf(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'i') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'f') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_If, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getInt(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'i') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'n') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 't') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Int, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getPrint(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'p') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'r') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'i') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'n') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (c == 't') state = 5;
        else return fail(startIndex);
        break;
      case 5:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Print, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getReturn(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 'r') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'e') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 't') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'u') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (c == 'r') state = 5;
        else return fail(startIndex);
        break;
      case 5:
        if (c == 'n') state = 6;
        else return fail(startIndex);
        break;
      case 6:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_Return, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getTrue(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    switch (state) {
      case 0:
        if (c == 't') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == 'r') state = 2;
        else return fail(startIndex);
        break;
      case 2:
        if (c == 'u') state = 3;
        else return fail(startIndex);
        break;
      case 3:
        if (c == 'e') state = 4;
        else return fail(startIndex);
        break;
      case 4:
        if (!(includes(LETTERS_, c) || includes(DIGITS, c))) return {tokenData: {token: Token.T_True, index: startIndex, value}, index: index - 1};
        return fail(startIndex)
    }
    value += c;

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getPlus(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '+') return {tokenData: {token: Token.T_AOp_PL, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getMinus(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '-') return {tokenData: {token: Token.T_AOp_MN, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getMultiplication(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '*') return {tokenData: {token: Token.T_AOp_ML, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getDivision(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '/') return {tokenData: {token: Token.T_AOp_DV, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getLess(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '<') return {tokenData: {token: Token.T_ROp_L, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getGreater(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '>') return {tokenData: {token: Token.T_ROp_G, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getLessEqual(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '<') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '=') return {tokenData: {token: Token.T_ROp_LE, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getGreaterEqual(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '>') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '=') return {tokenData: {token: Token.T_ROp_GE, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getNotEqual(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '!') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '=') return {tokenData: {token: Token.T_ROp_NE, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getEqual(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '=') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '=') return {tokenData: {token: Token.T_ROp_E, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getAnd(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '&') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '&') return {tokenData: {token: Token.T_LOp_AND, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getOr(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '|') state = 1;
        else return fail(startIndex);
        break;
      case 1:
        if (c == '|') return {tokenData: {token: Token.T_LOp_OR, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getNot(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '!') return {tokenData: {token: Token.T_LOp_NOT, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getAssignment(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '=') return {tokenData: {token: Token.T_Assign, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getLeftParenthesis(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '(') return {tokenData: {token: Token.T_LP, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getRightParenthesis(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == ')') return {tokenData: {token: Token.T_RP, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getLeftCurlyBrace(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '{') return {tokenData: {token: Token.T_LC, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getRightCurlyBrace(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '}') return {tokenData: {token: Token.T_RC, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getLeftBracket(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '[') return {tokenData: {token: Token.T_LB, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getRightBracket(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == ']') return {tokenData: {token: Token.T_RB, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getSemicolon(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == ';') return {tokenData: {token: Token.T_Semicolon, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getComma(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == ',') return {tokenData: {token: Token.T_Comma, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

async function getReminder(text: string, startIndex: number, scannerService: ScannerService, stepDelay: number): Promise<TokenExtractionData> {
  let state: number = 0;
  let index: number = startIndex;
  let value: string = "";
  while (true) {
    if (stepDelay != 0) await wait(stepDelay);
    const c: string = text.charAt(index);
    value += c;
    switch (state) {
      case 0:
        if (c == '%') return {tokenData: {token: Token.T_AOp_RM, index: startIndex, value}, index};
        else return fail(startIndex);
    }

    if (stepDelay != 0) scannerService.explorerIndex.next(index);
    index++;
  }
}

function fail(startIndex: number): TokenExtractionData {
  return {tokenData: {token: Token.T_Fail, index: startIndex, value: ""}, index: startIndex};
}

function includes(text: string, c: string) {
  if (c.length == 0) return false;

  for (let character of text)
    if (character == c) return true;

  return false;
}

export async function scan(data: string, scannerService: ScannerService, logService: LogService, stepDelay: number): Promise<TokenData[]> {
  let index: number = 0;
  let tokenExtractionData: TokenExtractionData;
  let tokens: TokenData[] = [];
  while (index < data.length) {
    tokenExtractionData = await getComment(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Comment!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Comment!`, status: Status.FAIL });

    // Keywords
    tokenExtractionData = await getBool(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Bool!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Bool!`, status: Status.FAIL });

    tokenExtractionData = await getBreak(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Break!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Break!`, status: Status.FAIL });

    tokenExtractionData = await getChar(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Char!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Char!`, status: Status.FAIL });

    tokenExtractionData = await getContinue(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Continue!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Continue!`, status: Status.FAIL });

    tokenExtractionData = await getElse(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Else!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Else!`, status: Status.FAIL });

    tokenExtractionData = await getFalse(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Flase!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Flase!`, status: Status.FAIL });

    tokenExtractionData = await getFor(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_For!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_For!`, status: Status.FAIL });

    tokenExtractionData = await getIf(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_If!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_If!`, status: Status.FAIL });

    tokenExtractionData = await getInt(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Int!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Int!`, status: Status.FAIL });

    tokenExtractionData = await getPrint(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Print!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Print!`, status: Status.FAIL });

    tokenExtractionData = await getReturn(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Return!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Return!`, status: Status.FAIL });

    tokenExtractionData = await getTrue(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_True!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_True!`, status: Status.FAIL });

    tokenExtractionData = await getHexadecimal(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Hexadecimal!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Hexadecimal!`, status: Status.FAIL });

    tokenExtractionData = await getDecimal(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Decimal!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Decimal!`, status: Status.FAIL });

    // Arithmetic Operators
    tokenExtractionData = await getPlus(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_AOp_PL!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_AOp_PL!`, status: Status.FAIL });

    tokenExtractionData = await getMinus(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_AOp_MN!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_AOp_MN!`, status: Status.FAIL });

    tokenExtractionData = await getMultiplication(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_AOp_ML!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_AOp_ML!`, status: Status.FAIL });

    tokenExtractionData = await getDivision(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_AOp_DV!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_AOp_DV!`, status: Status.FAIL });

    tokenExtractionData = await getReminder(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_AOp_RM!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_AOp_RM!`, status: Status.FAIL });

    // Relational Operators
    tokenExtractionData = await getLessEqual(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_LE!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_LE!`, status: Status.FAIL });

    tokenExtractionData = await getGreaterEqual(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_GE!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_GE!`, status: Status.FAIL });

    tokenExtractionData = await getLess(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_L!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_L!`, status: Status.FAIL });

    tokenExtractionData = await getGreater(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_G!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_G!`, status: Status.FAIL });

    tokenExtractionData = await getNotEqual(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_NE!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_NE!`, status: Status.FAIL });

    tokenExtractionData = await getEqual(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_E!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_E!`, status: Status.FAIL });

    // Logical Operators
    tokenExtractionData = await getAnd(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_AND!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_AND!`, status: Status.FAIL });

    tokenExtractionData = await getOr(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_OR!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_OR!`, status: Status.FAIL });

    tokenExtractionData = await getNot(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LOp_NOT!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LOp_NOT!`, status: Status.FAIL });

    // Other Operators
    tokenExtractionData = await getAssignment(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Assign!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Assign!`, status: Status.FAIL });

    tokenExtractionData = await getLeftParenthesis(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LP!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LP!`, status: Status.FAIL });

    tokenExtractionData = await getRightParenthesis(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_RP!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_RP!`, status: Status.FAIL });

    tokenExtractionData = await getLeftCurlyBrace(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LC!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LC!`, status: Status.FAIL });

    tokenExtractionData = await getRightCurlyBrace(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_RC!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_RC!`, status: Status.FAIL });

    tokenExtractionData = await getLeftBracket(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_LB!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_LB!`, status: Status.FAIL });

    tokenExtractionData = await getRightBracket(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_RB!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_RB!`, status: Status.FAIL });

    tokenExtractionData = await getSemicolon(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Semicolon!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Semicolon!`, status: Status.FAIL });

    tokenExtractionData = await getComma(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Comma!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Comma!`, status: Status.FAIL });

    // Other Tokens
    tokenExtractionData = await getId(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Id!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Id!`, status: Status.FAIL });

    tokenExtractionData = await getString(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_String!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_String!`, status: Status.FAIL });

    tokenExtractionData = await getCharacter(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Character!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Character!`, status: Status.FAIL });

    tokenExtractionData = await getWhitespace(data, index, scannerService, stepDelay);
    if (tokenExtractionData.tokenData.token != Token.T_Fail) {
      tokens.push(tokenExtractionData.tokenData);
      if (stepDelay != 0) {
        scannerService.headIndex.next(tokenExtractionData.index);
        scannerService.token.next(tokenExtractionData.tokenData);
        logService.log.next({ value: `Succeeded to extract T_Whitespace!`, status: Status.SUCCESS });
      }
      index = tokenExtractionData.index + 1;
      continue;
    }
    if (stepDelay != 0) logService.log.next({ value: `Failed  to extract T_Whitespace!`, status: Status.FAIL });

    logService.log.next({ value: "Something went wrong!", status: Status.FAIL });
    return tokens;
  }

  logService.log.next({ value: "Lexical analyse completed!", status: Status.SUCCESS });

  return tokens;
}

export function escape(text: string) {
  return text.replace("\n", "\\n").replace("\t", "\\t");
}

export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
