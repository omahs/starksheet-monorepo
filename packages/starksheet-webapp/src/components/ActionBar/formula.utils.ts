import { BigNumberish, toBN } from "starknet/utils/number";
import StarkSheetContract from "../../contract.json";
import BN from "bn.js";
import { UINT_128_MAX } from "starknet/utils/uint256";

const FIELD_PRIME = toBN(2)
  .pow(toBN(251))
  .add(toBN(17).mul(toBN(2).pow(toBN(192))))
  .add(toBN(1));

const validFormulaRegex =
  /^(SUM|MINUS|DIVIDE|MULTIPLY)\((([A-Z]+\d+);)+([A-Z]+\d+)\)$/;

export const operationNumbers = {
  SUM: toBN(StarkSheetContract.operations.SUM),
  MINUS: toBN(StarkSheetContract.operations.MINUS),
  DIVIDE: toBN(StarkSheetContract.operations.DIVIDE),
  MULTIPLY: toBN(StarkSheetContract.operations.MULTIPLY),
};

export type CellValue = {
  type: "number" | "formula";
  operation?: "SUM" | "MINUS" | "DIVIDE" | "MULTIPLY";
  dependencies?: string[];
  value?: number;
};

export function toPlainTextFormula(
  {
    value,
    dependencies,
  }: {
    value: BigNumberish;
    dependencies?: BigNumberish[];
  },
  cellNames: string[]
): string {
  if (!dependencies || dependencies.length === 0) {
    return value.toString();
  }

  const operator = Object.keys(operationNumbers).find(
    // @ts-ignore
    (key) => operationNumbers[key].toString() === value.toString()
  );

  if (!operator) {
    return "";
  }

  return `${operator}(${dependencies
    .map((dep) => cellNames[dep as number])
    .join(";")})`;
}

export function parse(cellName: string, formula: string): CellValue | null {
  const parsedNumber = parseNumberValue(formula);
  if (parsedNumber) {
    return parsedNumber;
  }

  const parsedFormula = parseFormulaValue(cellName, formula);
  if (parsedFormula && !parsedFormula.dependencies?.includes(cellName)) {
    return parsedFormula;
  }

  return null;
}

export function getError(cellName: string, formula: string): string | null {
  const parsedNumber = parseNumberValue(formula);
  if (parsedNumber) {
    return null;
  }

  const parsedFormula = parseFormulaValue(cellName, formula);
  if (parsedFormula) {
    if (parsedFormula.dependencies?.includes(cellName)) {
      return "You cannot reference a cell inside itself";
    }

    return null;
  }

  return "Invalid formula format";
}

export function parseNumberValue(formula: string): CellValue | null {
  const match = formula.match(/^\d+$/);

  if (!match) return null;

  return {
    type: "number",
    value: parseInt(formula),
  };
}

export function parseFormulaValue(
  cellName: string,
  formula: string
): CellValue | null {
  const match = formula.match(validFormulaRegex);

  if (!match) return null;

  const operation = match[1] as "SUM" | "MINUS" | "DIVIDE" | "MULTIPLY";
  const dependencies = formula
    .replace(operation, "")
    .replace("(", "")
    .replace(")", "")
    .split(";");

  return {
    type: "formula",
    operation,
    dependencies,
  };
}

export function buildFormulaDisplay(formula: string): string {
  const operator = formula.match(/(SUM|MINUS|DIVIDE|MULTIPLY)/);
  const cellNames = formula.match(/[A-Z]+\d+/g);

  let result = formula;

  if (operator) {
    result = result.replace(
      operator[0],
      `<span class="operator">${operator[0]}</span>`
    );
  }

  if (cellNames) {
    cellNames.forEach((name) => {
      result = result.replace(name, `<span class="cell">${name}</span>`);
    });
  }

  return result;
}

export function getValue(value: BN): BN {
  if (value.gt(UINT_128_MAX)) {
    return value
      .add(FIELD_PRIME.div(toBN(2)).abs())
      .mod(FIELD_PRIME)
      .sub(FIELD_PRIME.div(toBN(2)).abs());
  }

  return value;
}
