interface DerProps {
	children: React.ReactNode;
}

export function Der({ children }: DerProps) {
	return (
		<>
			<h1>Der</h1>
			{children}
		</>
	);
}
