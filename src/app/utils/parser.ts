import {ParserService} from "../services/parser.service";
import {wait} from "./scanner";
import {TokenData} from "../interfaces/token-data.interface";
import {SimulationContentType} from "../app.component";
import {Token} from "../enums/token.enum";
import {LogService} from "../services/log.service";
import {Status} from "../enums/status.enum";
import { saveAs } from 'file-saver';

export const CPP_GRAMMAR: Grammar = {
  S: [["V_Program"]],
  V_Program: [["V_Function", "V_Program"], ["ε"]],
  V_Function: [["V_Type", "T_Id", "T_LP", "V_FunctionParams", "T_RP", "T_LC", "V_Statements", "T_RC"]],
  V_Type: [["T_Int"], ["T_Char"], ["T_Bool"]],
  V_FunctionParams: [["V_Param", "V_ParamList"], ["ε"]],
  V_ParamList: [["T_Comma", "V_Param", "V_ParamList"], ["ε"]],
  V_Param: [["V_Type", "T_Id", "V_ConstBracket"]],
  V_ConstBracket: [["T_LB", "T_Decimal", "T_RB", "V_ConstBracket"], ["ε"]],
  V_Statements: [["V_Statement", "V_Statements"], ["ε"]],
  V_Statement: [["V_IfStatement"], ["V_ForStatement"], ["V_Assignment", "T_Semicolon"], ["V_UnaryAssignment", "T_Semicolon"], ["V_Declaration", "T_Semicolon"], ["V_PrintStatement", "T_Semicolon"], ["V_OtherStatement"]],
  V_Declaration: [["V_Type", "V_Declarations"]],
  V_Declarations: [["V_VariableDeclaration", "V_DeclarationList"], ["ε"]],
  V_DeclarationList: [["T_Comma", "V_VariableDeclaration", "V_DeclarationList"], ["ε"]],
  V_VariableDeclaration: [["V_MutableDeclaration", "V_AssignDeclaration"]],
  V_AssignDeclaration: [["T_Assign", "V_Expression"], ["ε"]],
  V_MutableDeclaration: [["T_Id", "V_ConstBracket"]],
  V_Mutable: [["T_Id", "V_Bracket"]],
  V_Bracket: [["T_LB", "V_Expression", "T_RB", "V_Bracket"], ["ε"]],
  V_Assign: [["T_Assign", "V_Expression"], ["T_AOp_PL", "T_Assign", "V_Expression"], ["T_AOp_MN", "T_Assign", "V_Expression"], ["T_AOp_ML", "T_Assign", "V_Expression"], ["T_AOp_DV", "T_Assign", "V_Expression"], ["T_AOp_RM", "T_Assign", "V_Expression"], ["ε"]],
  V_CheckCall: [["V_Call"], ["V_Assign"], ["V_Bracket", "V_Assign"]],
  V_OtherStatement: [["T_Break", "T_Semicolon"], ["T_Continue", "T_Semicolon"], ["T_Return", "V_Expression", "T_Semicolon"]],
  V_Args: [["V_Expression", "V_ArgsList"], ["ε"]],
  V_ArgsList: [["T_Comma", "V_Expression", "V_ArgsList"], ["ε"]],
  V_Assignment: [["T_Id", "V_CheckCall"]],
  V_Expression: [["V_AndExpression", "V_ExpressionTemp"]],
  V_ExpressionTemp: [["T_LOp_OR", "V_AndExpression", "V_ExpressionTemp"], ["ε"]],
  V_AndExpression: [["V_UnaryExpression", "V_AndExpressionTemp"]],
  V_AndExpressionTemp: [["T_LOp_AND", "V_UnaryExpression", "V_AndExpressionTemp"], ["ε"]],
  V_UnaryExpression: [["T_LOp_NOT", "V_UnaryExpression"], ["V_RelationalExpression"]],
  V_RelationalExpression: [["V_SumExpression", "V_RelationalExpressionTemp"]],
  V_RelationalExpressionTemp: [["V_RelationalOperator", "V_SumExpression", "V_RelationalExpressionTemp"], ["ε"]],
  V_RelationalOperator: [["T_ROp_LE"], ["T_ROp_L"], ["T_ROp_GE"], ["T_ROp_G"], ["T_ROp_NE"], ["T_ROp_E"]],
  V_SumExpression: [["V_MulExpression", "V_SumExpressionTemp"]],
  V_SumExpressionTemp: [["V_SumOperator", "V_MulExpression", "V_SumExpressionTemp"], ["ε"]],
  V_SumOperator: [["T_AOp_PL"], ["T_AOp_MN"]],
  V_MulExpression: [["V_Factor", "V_MulExpressionTemp"]],
  V_MulExpressionTemp: [["V_MulOperator", "V_Factor", "V_MulExpressionTemp"], ["ε"]],
  V_MulOperator: [["T_AOp_ML"], ["T_AOp_DV"], ["T_AOp_RM"]],
  V_Factor: [["V_Immutable"], ["T_Id", "V_MutableORFunctionCall"]],
  V_MutableORFunctionCall: [["V_Bracket"], ["V_Call"], ["ε"]],
  V_Call: [["T_LP", "V_Args", "T_RP"]],
  V_Immutable: [["T_LP", "V_Expression", "T_RP"], ["V_Const"], ["T_AOp_PL", "V_Factor"], ["T_AOp_MN", "V_Factor"], ["T_LOp_NOT", "V_Expression"]],
  V_Const: [["T_Hexadecimal"], ["T_String"], ["T_Character"], ["T_True"], ["T_False"], ["T_Decimal"]],
  V_ForStatement: [["T_For", "T_LP", "V_PreLoop", "T_Semicolon", "V_OptionalExpression", "T_Semicolon", "V_OptionalAssignment", "T_RP", "T_LC", "V_Statements", "T_RC"]],
  V_PreLoop: [["V_Declaration"], ["V_Assignment"], ["ε"]],
  V_OptionalExpression: [["V_Expression"], ["ε"]],
  V_OptionalAssignment: [["V_Assignment"], ["V_UnaryAssignment"], ["ε"]],
  V_IfStatement: [["T_If", "T_LP", "V_Expression", "T_RP", "T_LC", "V_Statements", "T_RC", "V_ElseIf"]],
  V_ElseIf: [["T_Else", "V_CheckIf"], ["ε"]],
  V_CheckIf: [["V_IfStatement"], ["V_Block"]],
  V_Block: [["T_LC", "V_Statements", "T_RC"]],
  V_PrintStatement: [["T_Print", "T_LP", "V_Args", "T_RP"]],
  V_UnaryAssignment: [["T_AOp_PL", "T_AOp_PL", "V_Mutable"], ["T_AOp_MN", "T_AOp_MN", "V_Mutable"]],
};

export const CPP_TERMINALS: string[] = [
  "T_Fail",
  "T_Bool",
  "T_Break",
  "T_Char",
  "T_Continue",
  "T_Else",
  "T_False",
  "T_For",
  "T_If",
  "T_Int",
  "T_Print",
  "T_Return",
  "T_True",
  "T_AOp_PL",
  "T_AOp_MN",
  "T_AOp_ML",
  "T_AOp_DV",
  "T_AOp_RM",
  "T_ROp_L",
  "T_ROp_G",
  "T_ROp_LE",
  "T_ROp_GE",
  "T_ROp_NE",
  "T_ROp_E",
  "T_LOp_AND",
  "T_LOp_OR",
  "T_LOp_NOT",
  "T_Assign",
  "T_LP",
  "T_RP",
  "T_LC",
  "T_RC",
  "T_LB",
  "T_RB",
  "T_Semicolon",
  "T_Comma",
  "T_Id",
  "T_Decimal",
  "T_Hexadecimal",
  "T_String",
  "T_Character",
  "T_Comment",
  "T_Whitespace",
  "ε",
  "$",
]

export interface Grammar {
  S: string[][];
  [variable: string]: string[][];
};

export interface FirstSet {
  [variable: string]: Set<string>;
};

export interface FollowSet {
  [variable: string]: Set<string>;
};

function calculateFirstSets(grammar: Grammar, terminals: string[]): FirstSet {
  const first: FirstSet = {};

  for (const variable in grammar) {
    first[variable] = new Set();
  }

  let changes = true;

  while (changes) {
    changes = false;

    for (const variable in grammar) {
      for (const production of grammar[variable]) {
        for (const symbol of production) {
          if (terminals.includes(symbol)) {
            if (!first[variable].has(symbol)) {
              first[variable].add(symbol);
              changes = true;
            }
            break;
          } else {
            const sizeBefore = first[variable].size;
            for (const item of first[symbol]) {
              if (item !== 'ε') {
                first[variable].add(item);
              }
            }
            const sizeAfter = first[variable].size;
            if (sizeBefore !== sizeAfter) {
              changes = true;
            }
            if (!first[symbol].has('ε')) {
              break;
            }
          }
        }
      }
    }
  }

  return first;
}

function calculateFollowSets(grammar: Grammar, terminals: string[], start: string, first: FirstSet): FollowSet {
  const follow: FollowSet = {};

  // Initialize FOLLOW sets
  for (const variable in grammar) {
    follow[variable] = new Set();
  }
  follow[start].add('$');

  let changes = true;

  while (changes) {
    changes = false;

    for (const variable in grammar) {
      for (const production of grammar[variable]) {
        for (let i = 0; i < production.length; i++) {
          const symbol = production[i];

          if (!terminals.includes(symbol)) {
            let followAdded = false;
            if (i + 1 < production.length) {
              const nextSymbol = production[i + 1];
              if (terminals.includes(nextSymbol)) {
                if (!follow[symbol].has(nextSymbol)) {
                  follow[symbol].add(nextSymbol);
                  followAdded = true;
                }
              } else {
                const sizeBefore = follow[symbol].size;
                for (const item of first[nextSymbol]) {
                  if (item !== 'ε') {
                    follow[symbol].add(item);
                  }
                }
                if (first[nextSymbol].has('ε')) {
                  for (const item of follow[variable]) {
                    follow[symbol].add(item);
                  }
                }
                const sizeAfter = follow[symbol].size;
                if (sizeBefore !== sizeAfter) {
                  followAdded = true;
                }
              }
            } else {
              const sizeBefore = follow[symbol].size;
              for (const item of follow[variable]) {
                follow[symbol].add(item);
              }
              const sizeAfter = follow[symbol].size;
              if (sizeBefore !== sizeAfter) {
                followAdded = true;
              }
            }

            if (followAdded) {
              changes = true;
            }
          }
        }
      }
    }
  }

  return follow;
}

type TransitionTable = {
  [variable: string]: {
    [terminal: string]: string[] | null;
  };
};

function createTransitionTable(grammar: Grammar, first: FirstSet, follow: FollowSet, terminals: string[]): TransitionTable {
  const table: TransitionTable = {};

  // Initialize the transition table with null values
  for (const variable in grammar) {
    table[variable] = {};
    for (const terminal of terminals) {
      table[variable][terminal] = null;
    }
    table[variable]['$'] = null; // For the end-of-input symbol
  }

  // Fill the transition table based on FIRST and FOLLOW sets
  for (const variable in grammar) {
    for (const terminal of follow[variable]) {
      table[variable][terminal] = ['sync'];
    }
    for (const production of grammar[variable]) {
      const firstSet = calculateFirstOfProduction(production, first, terminals);

      if (firstSet.has('ε') || production.length === 0) {
        for (const terminal of follow[variable]) {
          table[variable][terminal] = production;
        }
      }
    }
    for (const production of grammar[variable]) {
      const firstSet = calculateFirstOfProduction(production, first, terminals);

      for (const terminal of firstSet) {
        if (terminal !== 'ε') {
          table[variable][terminal] = production;
        }
      }
    }
  }

  return table;
}

function calculateFirstOfProduction(production: string[], first: FirstSet, terminals: string[]): Set<string> {
  const result = new Set<string>();

  for (const symbol of production) {
    if (terminals.includes(symbol)) {
      result.add(symbol);
      break;
    }

    const firstSet = first[symbol];
    for (const terminal of firstSet) {
      if (terminal !== 'ε') {
        result.add(terminal);
      }
    }

    if (!firstSet.has('ε')) {
      break;
    }
  }

  if (production.length === 0 || production.every(symbol => first[symbol]?.has('ε'))) {
    result.add('ε');
  }

  return result;
}

function prettyPrintTransitionTable(table: TransitionTable, terminals: string[], pad: number): void {
  const variables = Object.keys(table);

  // Create header
  let headerRow = terminals.map(h => h.padEnd(pad)).join('');
  headerRow = ' '.repeat(pad) + ` | ${headerRow}`;
  console.log(headerRow);
  console.log('-'.repeat(headerRow.length));

  // Create rows for each variable
  for (const variable of variables) {
    const row = [`${variable.padEnd(pad)} | `];
    for (const terminal of terminals) {
      const production = table[variable][terminal];
      row.push(production ? production.join('').padEnd(pad) : 'null'.padEnd(pad));
    }
    console.log(row.join(''));
  }
}

async function predictiveParse(input: TokenData[], transitionTable: TransitionTable, startVariable: string, terminals: string[], ignoredTerminals: string[], parserService: ParserService, logService: LogService, stepDelay: number): Promise<boolean> {
  const stack: string[] = ['$', startVariable];
  let index = 0;
  let derivations: string[] = [`${startVariable} $`];
  let panicMode = false;
  let isValid = true;
  let top: string;
  let finalInput: string[] = [];
  const root: Node = {
    value: "",
    name: "S",
    index: -1,
    line: -1,
    inlineIndex: -1,
    type: "",
    ctype: "",
    parent: {} as Node,
    siblings: [],
    isLeaf: false,
    children: []
  };
  const nodeStack: Node[] = [root];

  let currentNode: Node;
  while (stack.length > 0) {
    const currentTokenData = input[index];
    const currentInput = currentTokenData.token.valueOf();
    if (stepDelay != 0) {
      parserService.simulationContent.next({
        content: currentTokenData.value,
        type: SimulationContentType.OPEN
      });
    }

    if (stepDelay != 0) await wait(stepDelay);

    if (ignoredTerminals.includes(currentInput)) {
      if (stepDelay != 0) {
        parserService.simulationContent.next({
          content: currentTokenData.value,
          type: SimulationContentType.NORMAL
        });
      }
      index++;
      continue;
    }

    if (!panicMode) {
      const derivation = finalInput.join(' ') + ' ' + [...stack].reverse().join(' ')
      derivations.push(derivation);
      parserService.derivation.next(derivation);
    }

    top = panicMode ?  top! : stack.pop()!;
    currentNode = nodeStack.pop()!;

    if (terminals.includes(top)) {
      if (top === currentInput) {
        index++;
        if (top !== "$") {
          currentNode.value = currentTokenData.value;
          currentNode.index = currentTokenData.index;
          currentNode.line = currentTokenData.index;
          currentNode.inlineIndex = currentTokenData.index;
        }
        if (stepDelay != 0) {
          parserService.simulationContent.next({
            content: currentTokenData.value,
            type: SimulationContentType.NORMAL
          });
        }
      } else {
        if (stepDelay != 0) {
          parserService.simulationContent.next({
            content: tokenMap[top],
            type: SimulationContentType.ABSENCE
          });
        }
        logService.log.next({value: `[${currentTokenData.index}]: ${tokenMap[top]} is missing!`, status: Status.FAIL});
        isValid = false;
      }
      finalInput.push(top);
    } else {
      const production = transitionTable[top][currentInput];
      if (production) {
        panicMode = false;
        if (production[0] === 'sync') {
          isValid = false;
          logService.log.next({value: `[${currentTokenData.index}]: ${top} is missing!`, status: Status.FAIL});
          if (stepDelay != 0) {
            parserService.simulationContent.next({
              content: top,
              type: SimulationContentType.ABSENCE
            });
          }
        } else {
          if (production[0] !== 'ε') {
            for (let i = production.length - 1; i >= 0; i--) {
              stack.push(production[i]);
              const node = {
                value: "",
                name: production[i],
                index: -1,
                inlineIndex: -1,
                line: -1,
                ctype: "",
                type: "",
                parent: {} as Node,
                siblings: [],
                isLeaf: false,
                children: []
              };
              if (terminals.includes(production[i])) {
                if (node.name === "T_Decimal") {
                  node.ctype = "int";
                }
                if (node.name === "T_Hexadecimal") {
                  node.ctype = "int";
                }
                if (node.name === "T_String") {
                  node.ctype = "array";
                }
                if (node.name === "T_Character") {
                  node.ctype = "char";
                }
                if (node.name === "T_Int") {
                  node.ctype = "int";
                }
                if (node.name === "T_Bool") {
                  node.ctype = "bool";
                }
                if (node.name === "T_Char") {
                  node.ctype = "char";
                }
                if (node.name === "T_True") {
                  node.ctype = "bool";
                }
                if (node.name === "T_False") {
                  node.ctype = "bool";
                }
              }
              nodeStack.push(node);
              currentNode.children.unshift(node);
            }
          } else {
            const node = {
              value: "",
              name: production[0],
              index: -1,
              inlineIndex: -1,
              line: -1,
              ctype: "",
              type: "",
              parent: {} as Node,
              siblings: [],
              isLeaf: false,
              children: []
            };
            currentNode.children.unshift(node);
          }
        }
      } else {
        isValid = false;
        if (stepDelay != 0) {
          parserService.simulationContent.next({
            content: currentTokenData.value,
            type: SimulationContentType.EXCESS
          });
        }
        logService.log.next({value: `[${currentTokenData.index}]: ${currentTokenData.value} is excess!`, status: Status.FAIL});
        index++;
        panicMode = true;
      }
    }
  }

  if (isValid) {
    logService.log.next({value: `Something went wrong!`, status: Status.SUCCESS});
  } else {
    logService.log.next({value: `Syntax analyse Complete!`, status: Status.FAIL});
  }
  console.log(root);
  const jsonString = JSON.stringify(root, null, 2);
  const blob = new Blob([jsonString], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, 'tree.json');

  return isValid;
}

// Example usage
const grammar: Grammar = CPP_GRAMMAR;
const terminals: string[] = CPP_TERMINALS;

const first = calculateFirstSets(grammar, terminals);
const follow = calculateFollowSets(grammar, terminals, 'S', first);

const transitionTable = createTransitionTable(grammar, first, follow, terminals);

export async function parse(inputArray: TokenData[], parserService: ParserService, logService: LogService, stepDelay: number): Promise<boolean> {
  if (inputArray.length == 0) {
    logService.log.next({value: "Syntax analyse Complete!", status: Status.SUCCESS});
    return Promise.resolve(true);
  }
  return await predictiveParse(inputArray.concat({
    token: Token.T_Dollar,
    value: "$",
    index: inputArray[inputArray.length - 1].index + inputArray[inputArray.length - 1].value.length
  }), transitionTable, 'S', terminals, [Token.T_Whitespace.valueOf(), Token.T_Comment.valueOf()], parserService, logService, stepDelay);
}

const tokenMap: {[key: string]: string} = {
  T_Bool: "bool",
  T_Break: "break",
  T_Char: "char",
  T_Continue: "continue",
  T_Else: "else",
  T_False: "false",
  T_For: "for",
  T_If: "if",
  T_Int: "int",
  T_Print: "print",
  T_Return: "return",
  T_True: "true",
  T_AOp_PL: "+",
  T_AOp_MN: "-",
  T_AOp_ML: "*",
  T_AOp_DV: "/",
  T_AOp_RM: "%",
  T_ROp_L: "<",
  T_ROp_G: ">",
  T_ROp_LE: "<=",
  T_ROp_GE: ">=",
  T_ROp_NE: "!=",
  T_ROp_E: "==",
  T_LOp_AND: "&&",
  T_LOp_OR: "||",
  T_LOp_NOT: "!",
  T_Assign: "=",
  T_LP: "(",
  T_RP: ")",
  T_LC: "{",
  T_RC: "}",
  T_LB: "[",
  T_RB: "]",
  T_Semicolon: ";",
  T_Comma: ",",
  T_Id: "T_Id",
  T_Decimal: "T_Decimal",
  T_Hexadecimal: "T_Hexadecimal",
  T_String: "T_String",
  T_Character: "T_Character",
  T_Comment: "T_Comment",
  T_Whitespace: "T_Whitespace",
  ε: "ε",
  $: "$",
}

export interface Node {
  value: string;
  name: string;
  index: number;
  line: number;
  inlineIndex: number;
  type: string;
  ctype: string;
  isLeaf: boolean;
  parent: Node;
  siblings: Node[];
  children: Node[];
}
