import { BigNumberish, toBN } from "starknet/utils/number";
import StarkSheetContract from "../../contract.json";
import BN from "bn.js";

const PRIME = toBN(2)
  .pow(toBN(251))
  .add(toBN(17).mul(toBN(2).pow(toBN(192))))
  .add(toBN(1));

const validFormulaRegex =
  /^(SUM|MINUS|DIVIDE|PRODUCT)\((([A-Z]+\d+);)+([A-Z]+\d+)\)$/;

export const operationNumbers = {
  SUM: toBN(StarkSheetContract.operations.SUM),
  MINUS: toBN(StarkSheetContract.operations.MINUS),
  DIVIDE: toBN(StarkSheetContract.operations.DIVIDE),
  PRODUCT: toBN(StarkSheetContract.operations.PRODUCT),
};

export type CellValue = {
  type: "number" | "formula";
  operation?: "SUM" | "MINUS" | "DIVIDE" | "PRODUCT";
  dependencies?: string[];
  value?: number;
};

export function toPlainTextFormula(
  {
    value,
    cell_calldata,
  }: {
    value: BigNumberish;
    cell_calldata?: BN[];
  },
  cellNames: string[]
): string {
  if (
    !cell_calldata ||
    cell_calldata.length === 0 ||
    cell_calldata[0].toString() === "0"
  ) {
    return value.toString();
  }

  const operator = Object.keys(operationNumbers).find(
    // @ts-ignore
    (key) => operationNumbers[key].toString() === value.toString()
  );

  if (!operator) {
    return "";
  }

  const dependencies = cell_calldata
    .slice(1)
    .map((data) => data.sub(toBN(1)).div(toBN(2)));

  return `${operator}(${dependencies
    .map((dep) => cellNames[dep.toNumber()])
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

  const operation = match[1] as "SUM" | "MINUS" | "DIVIDE" | "PRODUCT";
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
  const operator = formula.match(/(SUM|MINUS|DIVIDE|PRODUCT)/);
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
  return value
    .add(PRIME.div(toBN(2)).abs())
    .mod(PRIME)
    .sub(PRIME.div(toBN(2)).abs());
}
