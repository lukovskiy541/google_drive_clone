'use client';

export default function SyncStatus({ lastSync }) {
  return (
    <div className="sync-status">
      <span className="sync-dot" />
      <span className="sync-text">
        {lastSync ? `Остання синхронізація: ${new Date(lastSync).toLocaleString()}` : 'Ще не було синхронізації'}
      </span>
    </div>
  );
}
