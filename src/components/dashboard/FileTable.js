'use client';

import { formatDateTime, formatSize } from '@/lib/utils/format.js';

function countColumns(visible) {
  let count = 2; // name + actions
  if (visible.extension) count += 1;
  if (visible.created) count += 1;
  if (visible.updated) count += 1;
  if (visible.uploaded) count += 1;
  if (visible.edited) count += 1;
  if (visible.size) count += 1;
  return count;
}

export default function FileTable({ files, visibleColumns, onSelect, selectedId, onDelete, onDownload }) {
  const colspan = countColumns(visibleColumns);

  return (
    <div className="table-wrapper">
      <table className="files-table">
        <thead>
          <tr>
            <th>Назва</th>
            {visibleColumns.extension && <th>Тип</th>}
            {visibleColumns.created && <th>Створено</th>}
            {visibleColumns.updated && <th>Змінено</th>}
            {visibleColumns.uploaded && <th>Хто завантажив</th>}
            {visibleColumns.edited && <th>Хто редагував</th>}
            {visibleColumns.size && <th>Розмір</th>}
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 && (
            <tr>
              <td colSpan={colspan} className="table-empty">
                Тут поки пусто. Завантаж перший файл.
              </td>
            </tr>
          )}
          {files.map((file) => (
            <tr
              key={file.id}
              className={selectedId === file.id ? 'files-table__row--active' : ''}
              onClick={() => onSelect(file)}
            >
              <td>{file.original_name}</td>
              {visibleColumns.extension && <td>{file.extension}</td>}
              {visibleColumns.created && <td>{formatDateTime(file.created_at)}</td>}
              {visibleColumns.updated && <td>{formatDateTime(file.updated_at)}</td>}
              {visibleColumns.uploaded && <td>{file.uploaded_by}</td>}
              {visibleColumns.edited && <td>{file.edited_by}</td>}
              {visibleColumns.size && <td>{formatSize(file.size_bytes)}</td>}
              <td>
                <div className="row-actions">
                  <button
                    className="btn btn--small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDownload(file);
                    }}
                  >
                    Завантажити
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(file);
                    }}
                  >
                    Видалити
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
