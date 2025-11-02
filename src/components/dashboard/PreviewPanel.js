'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import CodePreview from '@/components/common/CodePreview.js';
import { formatSize } from '@/lib/utils/format.js';

export default function PreviewPanel({ selectedFile, preview, loading, onRefresh, onSave, onClose }) {
  const [draft, setDraft] = useState('');

  const fileMeta = useMemo(() => {
    if (!selectedFile) return '';
    const pieces = [];
    if (selectedFile.extension) {
      pieces.push(selectedFile.extension.toUpperCase());
    }
    if (selectedFile.size_bytes || selectedFile.size_bytes === 0) {
      pieces.push(formatSize(selectedFile.size_bytes));
    }
    return pieces.join(' • ');
  }, [selectedFile]);

  useEffect(() => {
    if (preview?.type === 'text') {
      setDraft(preview.content);
    }
  }, [preview, selectedFile?.id]);

  if (!selectedFile) {
    return (
      <div className="preview-panel preview-panel--empty">
        Обери файл, щоб побачити його вміст.
      </div>
    );
  }

  const isLoading = loading && !preview;

  let content = null;

  if (isLoading) {
    content = (
      <div className="preview-panel__placeholder preview-panel--loading">
        Завантаження вмісту...
      </div>
    );
  } else if (preview?.type === 'unsupported') {
    content = (
      <div className="preview-panel__placeholder preview-panel--empty">
        Перегляд цього типу файлу не підтримано. Але його можна скачати.
      </div>
    );
  } else if (preview?.type === 'text') {
    if (selectedFile?.extension === '.java') {
      content = <CodePreview language="java" value={draft} />;
    } else {
      content = (
        <>
          <textarea
            className="preview-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="preview-actions">
            <button className="btn" onClick={() => onSave(selectedFile, draft)} disabled={loading}>
              Зберегти зміни
            </button>
          </div>
        </>
      );
    }
  } else if (preview?.type === 'image') {
    content = (
      <div className="preview-media">
        <Image
          src={`data:${preview.mime};base64,${preview.content}`}
          alt={selectedFile.original_name}
          width={960}
          height={640}
          className="preview-image"
          unoptimized
        />
      </div>
    );
  } else if (preview) {
    content = (
      <div className="preview-panel__placeholder preview-panel--empty">
        Щось незрозуміле відобразилось, повтори спробу.
      </div>
    );
  } else {
    content = (
      <div className="preview-panel__placeholder preview-panel--empty">
        Не вдалося завантажити попередній перегляд. Спробуй оновити.
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-head">
        <div className="preview-head__titles">
          <h3>{selectedFile.original_name}</h3>
          {fileMeta && <span className="preview-head__meta">{fileMeta}</span>}
        </div>
        <div className="preview-head__actions">
          <button className="btn btn--outline" onClick={() => onRefresh(selectedFile)} disabled={loading}>
            Оновити
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
      <div className="preview-panel__body">{content}</div>
    </div>
  );
}
