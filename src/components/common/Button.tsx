import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { classNames } from "../classNames";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      fullWidth = false,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        className={classNames(
          "button",
          `button--${variant}`,
          fullWidth && "button--full",
          className,
        )}
        ref={ref}
        type={type}
      />
    );
  },
);
