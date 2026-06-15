import React from "react";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import { describe, it, expect, vi } from "vitest";
import Button from "@/components/ui/button";

describe("Button Component", () => {
  it("renders correctly with default properties", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-emerald-600");
  });

  it("applies secondary and sm size classes", () => {
    render(
      <Button variant="secondary" size="sm">
        Secondary Small
      </Button>
    );
    const button = screen.getByRole("button", { name: /secondary small/i });
    expect(button).toHaveClass("bg-slate-100");
    expect(button).toHaveClass("h-9");
  });

  it("fires click events correctly", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    fireEvent.click(screen.getByRole("button", { name: /clickable/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows spinner when isLoading is true", () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading Button
      </Button>
    );
    const button = screen.getByRole("button", { name: /loading button/i });
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toHaveClass("animate-spin");
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
