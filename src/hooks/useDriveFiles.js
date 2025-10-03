'use client';

import { useCallback, useEffect, useState } from 'react';

export function useDriveFiles(initialSort = 'extension') {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ sort, order, filter });
      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не вдалося отримати файли');
      }
      setFiles(data.files);
    } catch (err) {
      setError(err.message || 'Не вдалося отримати файли');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [sort, order, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    files,
    loading,
    error,
    sort,
    order,
    filter,
    setSort,
    setOrder,
    setFilter,
    refresh: load
  };
}
