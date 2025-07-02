import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("renders children correctly", () => {
		render(<Button>Click me</Button>);
		expect(screen.getByText("Click me")).toBeInTheDocument();
	});

	it("applies primary variant class by default", () => {
		render(<Button>Primary</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("button", "button--primary");
	});

	it("applies secondary variant class when specified", () => {
		render(<Button variant="secondary">Secondary</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("button", "button--secondary");
	});

	it("merges custom className with base classes", () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("button", "button--primary", "custom-class");
	});

	it("passes through other props", () => {
		const handleClick = () => {};
		render(
			<Button onClick={handleClick} disabled>
				Disabled
			</Button>,
		);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});
});
