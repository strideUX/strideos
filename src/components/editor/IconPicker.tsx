"use client";
import type { ReactElement } from "react";

interface IconPickerProps {
	value: string | null;
	onChange: (val: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps): ReactElement {
	return (
		<div 
			className="w-12 h-12 flex items-center justify-center cursor-pointer border rounded hover:bg-gray-50"
			onClick={() => {
				const emoji = prompt("Enter emoji:", value || "📄");
				onChange(emoji);
			}}
		>
			{value || "📄"}
		</div>
	);
}