type CrmTableCardProps = {
  caption: string;
  columns: string[];
  emptyMessage: string;
  maxTableHeight?: string;
  rows: string[][];
  title: string;
};

export function CrmTableCard({ caption, columns, emptyMessage, maxTableHeight, rows, title }: CrmTableCardProps) {
  return (
    <section className="section-card crm-table-card">
      <div className="table-header">
        <p className="eyebrow">{caption}</p>
        <h3 className="panel-title">{title}</h3>
      </div>

      {rows.length === 0 ? (
        <p className="body-copy">{emptyMessage}</p>
      ) : (
        <div
          className={`table-shell${maxTableHeight ? " table-shell-scrollable" : ""}`}
          style={maxTableHeight ? { maxHeight: maxTableHeight } : undefined}
        >
          <table className="crm-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
