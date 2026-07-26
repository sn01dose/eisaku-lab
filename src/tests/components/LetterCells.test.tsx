// @vitest-environment jsdom

import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LetterCells } from "../../components";
import "../../styles/index.css";
import "../../styles/app.css";

afterEach(cleanup);

function ControlledLetterCells({
  initialValue = "",
  correctAnswer = "test",
  onHint,
  onSubmit,
}: {
  initialValue?: string;
  correctAnswer?: string;
  onHint?: () => void;
  onSubmit?: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <output data-testid="current-value">{value}</output>
      <LetterCells
        value={value}
        correctAnswer={correctAnswer}
        expectedLength={correctAnswer.length}
        onChange={setValue}
        onHint={onHint}
        onSubmit={onSubmit}
      />
    </>
  );
}

describe("LetterCells", () => {
  it("renders one protected input per expected letter and submits with Enter", () => {
    const handleSubmit = vi.fn();

    render(
      <ControlledLetterCells
        initialValue="develop"
        correctAnswer="development"
        onSubmit={handleSubmit}
      />,
    );

    const group = screen.getByRole("group", {
      name: "英単語の綴りを入力",
    });
    const inputs = within(group).getAllByRole("textbox");

    expect(inputs).toHaveLength(11);
    expect(inputs.map((input) => input.getAttribute("value")).join("")).toBe(
      "develop",
    );
    for (const input of inputs) {
      expect(input).toHaveAttribute("maxlength", "1");
      expect(input).toHaveAttribute("autocapitalize", "off");
      expect(input).toHaveAttribute("autocorrect", "off");
      expect(input).toHaveAttribute("autocomplete", "off");
      expect(input).toHaveAttribute("spellcheck", "false");
      expect(input).toHaveAttribute("enterkeyhint", "done");
    }

    fireEvent.keyDown(inputs[0], { key: "Enter" });
    expect(handleSubmit).toHaveBeenCalledWith("develop");
  });

  it("advances after a letter and combines the cells for onChange", async () => {
    const user = userEvent.setup();
    render(<ControlledLetterCells />);

    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[0]);
    await user.keyboard("t");

    expect(screen.getByTestId("current-value")).toHaveTextContent("t");
    expect(document.activeElement).toBe(inputs[1]);

    await user.keyboard("e");
    expect(screen.getByTestId("current-value")).toHaveTextContent("te");
    expect(document.activeElement).toBe(inputs[2]);
  });

  it("keeps an entered letter visible in a 44px underline-only cell", async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledLetterCells />);

    const input = screen.getAllByRole("textbox")[0];
    await user.click(input);
    await user.keyboard("t");

    expect(input).toHaveValue("t");

    const inputStyle = getComputedStyle(input);
    expect(inputStyle.color).not.toBe("transparent");
    expect(inputStyle.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(inputStyle.fontSize).not.toBe("0px");
    expect(inputStyle.visibility).not.toBe("hidden");
    expect(inputStyle.opacity).not.toBe("0");

    const cell = input.closest(".letter-cell");
    expect(cell).not.toBeNull();
    const cellStyle = getComputedStyle(cell as Element);
    expect(Number.parseFloat(cellStyle.width)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(cellStyle.height)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(cellStyle.minWidth)).toBeGreaterThanOrEqual(44);
    expect(Number.parseFloat(cellStyle.minHeight)).toBeGreaterThanOrEqual(44);
    expect(cellStyle.placeItems).toBe("center");

    const surface = container.querySelector(".letter-cells__input-surface");
    expect(surface).not.toBeNull();
    const surfaceStyle = getComputedStyle(surface as Element);

    for (const style of [inputStyle, surfaceStyle]) {
      expect(style.borderTopWidth).toBe("0px");
      expect(style.borderRightWidth).toBe("0px");
      expect(style.borderBottomWidth).toBe("0px");
      expect(style.borderLeftWidth).toBe("0px");
    }
    expect(cellStyle.borderTopStyle).toBe("none");
    expect(cellStyle.borderRightStyle).toBe("none");
    expect(cellStyle.borderLeftStyle).toBe("none");
  });

  it("moves back and deletes the previous letter from an empty cell", async () => {
    const user = userEvent.setup();
    render(<ControlledLetterCells initialValue="te" />);

    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[2]);
    await user.keyboard("{Backspace}");

    expect(screen.getByTestId("current-value")).toHaveTextContent("t");
    expect(document.activeElement).toBe(inputs[1]);
    expect(inputs[1]).toHaveValue("");
  });

  it("moves between cells with the left and right arrow keys", async () => {
    const user = userEvent.setup();
    render(<ControlledLetterCells initialValue="test" />);

    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[1]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(inputs[2]);

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("expands a pasted word across all available cells", () => {
    render(<ControlledLetterCells />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "test" },
    });

    expect(screen.getByTestId("current-value")).toHaveTextContent("test");
    expect(inputs.map((input) => input.getAttribute("value")).join("")).toBe(
      "test",
    );
    expect(document.activeElement).toBe(inputs[3]);
  });

  it("opens the hint action from the question-mark key", () => {
    const handleHint = vi.fn();
    render(<ControlledLetterCells onHint={handleHint} />);

    fireEvent.keyDown(screen.getAllByRole("textbox")[0], {
      key: "?",
    });

    expect(handleHint).toHaveBeenCalledOnce();
  });

  it("does not render chunk hints unless their phase supplies them", () => {
    const { container, rerender } = render(
      <LetterCells value="" correctAnswer="test" expectedLength={4} />,
    );

    expect(container.querySelectorAll(".letter-cells__chunk-rule")).toHaveLength(
      0,
    );
    expect(
      container.querySelectorAll(".letter-cells__chunk-label"),
    ).toHaveLength(0);

    rerender(
      <LetterCells
        value=""
        correctAnswer="test"
        expectedLength={4}
        chunks={["te", "st"]}
      />,
    );
    expect(container.querySelectorAll(".letter-cells__chunk-rule")).toHaveLength(
      2,
    );
    expect(
      [...container.querySelectorAll(".letter-cells__chunk-label")].map(
        (element) => element.textContent,
      ),
    ).toEqual(["te", "st"]);

    rerender(
      <LetterCells
        value=""
        correctAnswer="test"
        expectedLength={4}
        chunks={["te", "st"]}
        chunkLabels={["te", ""]}
      />,
    );
    expect(
      [...container.querySelectorAll(".letter-cells__chunk-label")].map(
        (element) => element.textContent,
      ),
    ).toEqual(["te"]);
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
