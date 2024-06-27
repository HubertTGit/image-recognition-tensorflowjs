interface CapturedProps {
  children: React.ReactNode;
}

export function Captured({ children }: CapturedProps) {
  return (
    <>
      <h1>Captured</h1>
      {children}
    </>
  );
}
