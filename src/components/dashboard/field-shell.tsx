type FieldShellProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function FieldShell({ children, icon }: FieldShellProps) {
  return (
    <div className="field-shell">
      {icon ? <span className="field-shell-icon">{icon}</span> : null}
      {children}
    </div>
  );
}
