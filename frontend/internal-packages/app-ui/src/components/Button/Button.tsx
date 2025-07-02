import type { ComponentPropsWithoutRef, FC } from "react";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	variant?: "primary" | "secondary";
}

export const Button: FC<ButtonProps> = ({
	variant = "primary",
	children,
	className,
	...props
}) => {
	const baseClass = `button button--${variant}`;
	const classes = className ? `${baseClass} ${className}` : baseClass;

	return (
		<button className={classes} {...props}>
			{children}
		</button>
	);
};
