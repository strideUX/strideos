"use client";
import { useSaveStatus } from "./SaveStatusContext";

export function SaveStatusIndicator() {
	const { status, lastSaved } = useSaveStatus();

	const getStatusText = () => {
		switch (status) {
			case "ready":
				return "Document Ready";
			case "saving":
				return "Saving...";
			case "saved":
				return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Saved";
			case "error":
				return "Save Error";
			default:
				return "Document Ready";
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case "ready":
				return "bg-gray-400";
			case "saving":
				return "bg-blue-400";
			case "saved":
				return "bg-green-400";
			case "error":
				return "bg-red-400";
			default:
				return "bg-gray-400";
		}
	};

	return (
		<div className="flex items-center gap-2 px-2 py-1 text-xs text-neutral-600">
			<div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
			<span>{getStatusText()}</span>
		</div>
	);
}