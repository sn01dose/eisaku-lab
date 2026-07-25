// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LetterCells } from "../../components";

afterEach(cleanup);

describe("LetterCells", () => {
  it("turns off mobile spelling assistance and submits with Enter", () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <LetterCells
        value="develop"
        correctAnswer="development"
        chunks={["de", "velop", "ment"]}
        chunkLabels={["接頭辞", "語幹", "接尾辞"]}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    );

    const input = screen.getByLabelText("英単語の綴りを入力");
    expect(input.getAttribute("autocapitalize")).toBe("off");
    expect(input.getAttribute("autocorrect")).toBe("off");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.getAttribute("spellcheck")).toBe("false");
    expect(input.getAttribute("enterkeyhint")).toBe("done");

    fireEvent.change(input, { target: { value: "developm" } });
    expect(handleChange).toHaveBeenCalledWith("developm");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(handleSubmit).toHaveBeenCalledWith("develop");
  });

  it("opens the hint action from the question-mark key", () => {
    const handleHint = vi.fn();
    render(<LetterCells value="" onHint={handleHint} />);

    fireEvent.keyDown(screen.getByLabelText("英単語の綴りを入力"), {
      key: "?",
    });

    expect(handleHint).toHaveBeenCalledOnce();
  });

  it("accepts spellDiff-shaped operations and exposes one result sentence", () => {
    const { container } = render(
      <LetterCells
        mode="graded"
        value="developament"
        correctAnswer="development"
        chunks={["de", "velop", "ment"]}
        operations={[
          {
            type: "substitute",
            expectedChar: "e",
            actualChar: "a",
            expectedIndex: 8,
            actualIndex: 8,
          },
        ]}
        feedback="音は合っています。語尾の -ment を確認しましょう。"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "正解 development、あなたの解答 developament",
      }),
    ).toBeTruthy();
    expect(screen.getByText("a").closest(".letter-cell")).toHaveClass(
      "letter-cell--substitute",
    );
    expect(
      container.querySelector(".letter-cell__correction")?.textContent,
    ).toBe("e");
  });

  it("draws exactly one arc for an adjacent transposition", () => {
    const { container } = render(
      <LetterCells
        mode="graded"
        value="teh"
        correctAnswer="the"
        operations={[
          { type: "match", expected: "t", actual: "t" },
          { type: "transpose", expected: "he", actual: "eh" },
        ]}
      />,
    );

    expect(container.querySelectorAll(".letter-cells__transpose-arc")).toHaveLength(
      1,
    );
  });
});
