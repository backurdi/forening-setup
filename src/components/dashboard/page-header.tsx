type PageHeaderProps = {
  action?: React.ReactNode;
  compact?: boolean;
  description?: string;
  icon?: React.ReactNode;
  title: string;
};

export function PageHeader({ action, compact = false, description, icon, title }: PageHeaderProps) {
  return (
    <section className={compact ? "page-header compact" : "page-header"}>
      <div className="page-header-copy">
        <div className="page-title-row">
          {icon ? <span className="page-title-icon">{icon}</span> : null}
          <h1 className="page-title">{title}</h1>
        </div>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </section>
  );
}
