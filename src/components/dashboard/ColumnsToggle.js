'use client';

export default function ColumnsToggle({ columns, onToggle }) {
  return (
    <div className="columns-toggle">
      <span className="columns-toggle__title">Колонки:</span>
      {columns.map((column) => (
        <label key={column.key} className="columns-toggle__item">
          <input
            type="checkbox"
            checked={column.visible}
            onChange={() => onToggle(column.key)}
          />
          {column.label}
        </label>
      ))}
    </div>
  );
}
