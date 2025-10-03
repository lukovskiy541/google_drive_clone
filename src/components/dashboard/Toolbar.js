'use client';

export default function Toolbar({
  order,
  filter,
  onToggleOrder,
  onFilterChange,
  onSyncClick,
  syncing,
  syncDir,
  onChooseSyncDir
}) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button className="btn" onClick={onToggleOrder}>
          Сортування за розширенням: {order === 'asc' ? 'А-Я' : 'Я-А'}
        </button>
        <select
          className="select"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="all">Показати всі типи</option>
          <option value="js-png">Лише .js та .png</option>
        </select>
      </div>
      <div className="toolbar__group">
        <span className="toolbar__path" title={syncDir || 'Не налаштовано'}>
          Локальна папка: {syncDir || 'Не налаштовано'}
        </span>
        <button className="btn" onClick={onChooseSyncDir}>
          Обрати папку
        </button>
        <button className="btn btn--outline" onClick={onSyncClick} disabled={syncing}>
          {syncing ? 'Синхронізація...' : 'Синхронізувати папку'}
        </button>
      </div>
    </div>
  );
}
