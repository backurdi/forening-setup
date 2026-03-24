type PageHeaderProps = {
  action?: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  title: string;
};

export function PageHeader({ action, description, icon, title }: PageHeaderProps) {
  return (
    <section className="page-header">
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
