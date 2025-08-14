"use client";

import React from 'react';

interface ErrorBoundaryProps {
	fallback: (args: { error: Error; reset: () => void }) => React.ReactNode;
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { error: null };
		this.handleReset = this.handleReset.bind(this);
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error): void {
		// Optionally log
		// console.error('ErrorBoundary caught:', error);
	}

	handleReset(): void {
		this.setState({ error: null });
	}

	render(): React.ReactNode {
		if (this.state.error) {
			return this.props.fallback({ error: this.state.error, reset: this.handleReset });
		}
		return this.props.children;
	}
}
