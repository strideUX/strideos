"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

export type SaveStatus = "ready" | "saving" | "saved" | "error";

interface SaveStatusContextType {
	status: SaveStatus;
	setStatus: (status: SaveStatus) => void;
	lastSaved: Date | null;
	setLastSaved: (date: Date) => void;
}

const SaveStatusContext = createContext<SaveStatusContextType | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<SaveStatus>("ready");
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	return (
		<SaveStatusContext.Provider value={{ status, setStatus, lastSaved, setLastSaved }}>
			{children}
		</SaveStatusContext.Provider>
	);
}

export function useSaveStatus() {
	const context = useContext(SaveStatusContext);
	if (!context) {
		throw new Error("useSaveStatus must be used within a SaveStatusProvider");
	}
	return context;
}