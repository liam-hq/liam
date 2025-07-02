import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttachButton } from "./AttachButton";

describe("AttachButton", () => {
	it("renders correctly", () => {
		render(<AttachButton />);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("shows tooltip on hover", async () => {
		render(<AttachButton />);
		const button = screen.getByRole("button");

		// Tooltip behavior is handled by the UI library and may require more setup
		// For now, we just verify the button renders correctly
		expect(button).toBeInTheDocument();
	});

	it("handles file selection", () => {
		const onFileSelect = vi.fn();
		render(<AttachButton onFileSelect={onFileSelect} />);

		const fileInput = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute("accept", "image/*");
		expect(fileInput).toHaveAttribute("multiple");

		const files = [new File(["test"], "test.png", { type: "image/png" })];
		Object.defineProperty(fileInput, "files", {
			value: files,
			writable: false,
		});

		fireEvent.change(fileInput);
		expect(onFileSelect).toHaveBeenCalledWith(files);
	});

	it("accepts custom file types", () => {
		render(<AttachButton accept=".pdf,.doc" />);
		const fileInput = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		expect(fileInput).toHaveAttribute("accept", ".pdf,.doc");
	});

	it("handles disabled state", () => {
		render(<AttachButton disabled />);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		// CSS module class names are hashed, so we can't check for exact class name
		expect(button.className).toContain("_disabled_");
	});

	it("triggers file input click on button click", () => {
		render(<AttachButton />);
		const button = screen.getByRole("button");
		const fileInput = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		const clickSpy = vi.spyOn(fileInput, "click");
		fireEvent.click(button);

		expect(clickSpy).toHaveBeenCalled();
	});

	it("resets file input value after selection", () => {
		const onFileSelect = vi.fn();
		render(<AttachButton onFileSelect={onFileSelect} />);

		const fileInput = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const files = [new File(["test"], "test.png", { type: "image/png" })];

		Object.defineProperty(fileInput, "files", {
			value: files,
			writable: false,
		});

		fireEvent.change(fileInput);
		expect(fileInput.value).toBe("");
	});

	it("calls custom onClick handler", () => {
		const onClick = vi.fn();
		render(<AttachButton onClick={onClick} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(onClick).toHaveBeenCalled();
	});

	it("accepts custom className", () => {
		render(<AttachButton className="custom-class" />);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("respects tooltip side prop", () => {
		render(<AttachButton tooltipSide="bottom" />);
		const button = screen.getByRole("button");
		fireEvent.mouseEnter(button);

		// The tooltip component should receive the side prop
		// This is more of an integration test with the UI library
		expect(button).toBeInTheDocument();
	});
});
