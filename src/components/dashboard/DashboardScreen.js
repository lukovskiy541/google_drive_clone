'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DropZone from './DropZone.js';
import FileTable from './FileTable.js';
import PreviewPanel from './PreviewPanel.js';
import Toolbar from './Toolbar.js';
import ColumnsToggle from './ColumnsToggle.js';
import SyncStatus from './SyncStatus.js';
import { useDriveFiles } from '@/hooks/useDriveFiles.js';
import { useAuth } from '@/context/AuthContext.js';

const defaultColumns = {
  extension: true,
  created: true,
  updated: true,
  uploaded: true,
  edited: true,
  size: true
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { files, loading, error, order, filter, setOrder, setFilter, refresh } = useDriveFiles('extension');
  const refreshTimeoutRef = useRef(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncProfile, setSyncProfile] = useState({ localDir: '', isCustom: false });

  const filesById = useMemo(() => {
    const map = new Map();
    files.forEach((file) => map.set(file.id, file));
    return map;
  }, [files]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      refresh();
      refreshTimeoutRef.current = null;
    }, 100);
  }, [refresh]);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setSelected(null);
    setPreview(null);
    setPreviewLoading(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const updated = filesById.get(selected.id);
    if (!updated) {
      closePreview();
      return;
    }
    if (updated !== selected) {
      setSelected(updated);
    }
  }, [closePreview, filesById, selected]);

  const fetchPreview = useCallback(async (file) => {
    setPreview(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}/content`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не вдалося завантажити вміст');
      }
      setPreview(data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      fetchPreview(selected);
    }
  }, [selected, fetchPreview]);

  useEffect(() => {
    const source = new EventSource('/api/sync/events');

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'synced') {
          setLastSync(payload.at);
          scheduleRefresh();
        }
        if (payload.type === 'updated') {
          scheduleRefresh();
        }
      } catch (error) {
        console.error('SSE parse error', error);
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/sync/profile');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Не вдалося прочитати налаштування синхронізації');
        }
        setSyncProfile(data.profile);
        if (data && Object.prototype.hasOwnProperty.call(data, 'lastSync')) {
          setLastSync(data.lastSync ?? null);
        }
      } catch (error) {
        setMessage((prev) => prev || error.message);
      }
    };

    loadProfile();
  }, []);

  const handleColumnsToggle = (key) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOrderToggle = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleFilterChange = (value) => {
    setFilter(value);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/files', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Не вийшло завантажити файл');
    }
    return data.file;
  };

  const handleDrop = async (droppedFiles) => {
    setMessage('');
    try {
      for (const file of droppedFiles) {
        await uploadFile(file);
      }
      scheduleRefresh();
      setMessage('Готово! Файли на сервері.');
    } catch (err) {
      setMessage(err.message || 'Помилка при завантаженні');
    }
  };

  const handleDelete = async (file) => {
    if (!confirm(`Точно видалити ${file.original_name}?`)) {
      return;
    }

    const res = await fetch(`/api/files/${file.id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Не вдалося видалити');
      return;
    }

    setMessage('Файл видалено');
    scheduleRefresh();
    if (selected?.id === file.id) {
      closePreview();
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) {
        throw new Error('Не вдалося скачати');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSave = async (file, content) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не вдалося зберегти');
      }
      setMessage('Зміни збережені');
      scheduleRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/sync/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Синк не спрацював');
      }
      setLastSync(data.lastSync ?? new Date().toISOString());
      scheduleRefresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleChooseSyncDir = async () => {
    try {
      const res = await fetch('/api/sync/profile/pick', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не вдалося оновити папку');
      }
      if (data.cancelled) {
        return;
      }
      setSyncProfile(data.profile);
      if (data && Object.prototype.hasOwnProperty.call(data, 'lastSync')) {
        setLastSync(data.lastSync ?? null);
      }
      setMessage('Каталог синхронізації оновлено');
      scheduleRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const columnsList = useMemo(
    () => [
      { key: 'extension', label: 'Тип', visible: columns.extension },
      { key: 'created', label: 'Створено', visible: columns.created },
      { key: 'updated', label: 'Змінено', visible: columns.updated },
      { key: 'uploaded', label: 'Хто завантажив', visible: columns.uploaded },
      { key: 'edited', label: 'Хто редагував', visible: columns.edited },
      { key: 'size', label: 'Розмір', visible: columns.size }
    ],
    [columns]
  );

  const handleSelectFile = useCallback(
    (file) => {
      setSelected(file);
      setPreviewOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closePreview, isPreviewOpen]);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Привіт, {user?.displayName || user?.display_name || 'користувачу'}!</h1>
        <div className="header-actions">
          <SyncStatus lastSync={lastSync} />
          <button className="btn btn--outline" onClick={() => logout()}>
            Вийти
          </button>
        </div>
      </header>

      <DropZone onFilesAdded={handleDrop} />

      <Toolbar
        order={order}
        filter={filter}
        onToggleOrder={handleOrderToggle}
        onFilterChange={handleFilterChange}
        onSyncClick={handleManualSync}
        syncing={syncing}
        syncDir={syncProfile?.localDir}
        onChooseSyncDir={handleChooseSyncDir}
      />

      <ColumnsToggle columns={columnsList} onToggle={handleColumnsToggle} />

      {message && <div className="alert">{message}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="dashboard__content">
        <div className="files-area">
          {loading ? (
            <div className="loader">Завантаження списку...</div>
          ) : (
            <FileTable
              files={files}
              visibleColumns={columns}
              onSelect={handleSelectFile}
              selectedId={selected?.id}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>

      {isPreviewOpen && (
        <div className="preview-overlay">
          <button className="preview-overlay__backdrop" onClick={closePreview}>
            <span className="sr-only">Закрити перегляд</span>
          </button>
          <div className="preview-overlay__content">
            <PreviewPanel
              selectedFile={selected}
              preview={previewLoading ? null : preview}
              loading={previewLoading}
              onRefresh={(file) => fetchPreview(file)}
              onSave={handleSave}
              onClose={closePreview}
            />
          </div>
        </div>
      )}
    </div>
  );
}
