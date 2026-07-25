export type LetterCellOperationType =
  | "match"
  | "substitute"
  | "insert"
  | "delete"
  | "transpose";

export interface LetterCellOperation {
  type: LetterCellOperationType;
  /** Character(s) entered by the learner. Empty for a deletion. */
  actual?: string;
  /** Character(s) in the accepted answer. Empty for an insertion. */
  expected?: string;
  /** Aliases used by domain/attempts/spellDiff, accepted without an adapter. */
  actualChar?: string;
  expectedChar?: string;
  actualIndex?: number;
  expectedIndex?: number;
}

export interface ExpandedLetterCellOperation {
  type: LetterCellOperationType;
  actual: string;
  expected: string;
}

export function expandOperations(
  operations: readonly LetterCellOperation[],
): ExpandedLetterCellOperation[] {
  return operations.flatMap((operation) => {
    const actual = operation.actual ?? operation.actualChar ?? "";
    const expected = operation.expected ?? operation.expectedChar ?? "";

    if (operation.type === "transpose") {
      return [{ type: operation.type, actual, expected }];
    }

    const length = Math.max(actual.length, expected.length, 1);
    return Array.from({ length }, (_, index) => ({
      type: operation.type,
      actual: actual[index] ?? "",
      expected: expected[index] ?? "",
    }));
  });
}

export function createFallbackOperations(
  answer: string,
  value: string,
): ExpandedLetterCellOperation[] {
  const result: ExpandedLetterCellOperation[] = [];
  let answerIndex = 0;
  let valueIndex = 0;

  while (answerIndex < answer.length || valueIndex < value.length) {
    const expected = answer[answerIndex] ?? "";
    const actual = value[valueIndex] ?? "";
    const transposed =
      answerIndex + 1 < answer.length &&
      valueIndex + 1 < value.length &&
      answer[answerIndex] === value[valueIndex + 1] &&
      answer[answerIndex + 1] === value[valueIndex];

    if (transposed) {
      result.push({
        type: "transpose",
        expected: answer.slice(answerIndex, answerIndex + 2),
        actual: value.slice(valueIndex, valueIndex + 2),
      });
      answerIndex += 2;
      valueIndex += 2;
    } else if (!expected) {
      result.push({ type: "insert", expected: "", actual });
      valueIndex += 1;
    } else if (!actual) {
      result.push({ type: "delete", expected, actual: "" });
      answerIndex += 1;
    } else {
      result.push({
        type: expected === actual ? "match" : "substitute",
        expected,
        actual,
      });
      answerIndex += 1;
      valueIndex += 1;
    }
  }

  return result;
}

export function resolveChunkLengths(
  chunks: readonly string[] | undefined,
  expectedLength: number,
): number[] {
  const suppliedLengths = chunks?.map((chunk) => [...chunk].length) ?? [];
  const suppliedTotal = suppliedLengths.reduce((sum, length) => sum + length, 0);

  return suppliedLengths.length > 0 && suppliedTotal === expectedLength
    ? suppliedLengths
    : [Math.max(expectedLength, 1)];
}

export function groupOperations(
  operations: readonly ExpandedLetterCellOperation[],
  chunkLengths: readonly number[],
): ExpandedLetterCellOperation[][] {
  const groups = chunkLengths.map(() => [] as ExpandedLetterCellOperation[]);
  let expectedCursor = 0;

  for (const operation of operations) {
    let boundary = 0;
    let groupIndex = chunkLengths.length - 1;

    for (let index = 0; index < chunkLengths.length; index += 1) {
      boundary += chunkLengths[index];
      if (expectedCursor < boundary) {
        groupIndex = index;
        break;
      }
    }

    groups[groupIndex].push(operation);
    if (operation.type !== "insert") {
      expectedCursor += Math.max(operation.expected.length, 1);
    }
  }

  return groups;
}
