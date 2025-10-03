import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useDriveFiles } from '../useDriveFiles.js';

function HookHarness({ initialSort = 'extension' }) {
  const {
    files, loading, error,
    setSort, setOrder, setFilter,
  } = useDriveFiles(initialSort);

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error}</div>
      <pre data-testid="files">{JSON.stringify(files)}</pre>
      <button onClick={() => setOrder('asc')}>order-asc</button>
      <button onClick={() => setOrder('desc')}>order-desc</button>
      <button onClick={() => setFilter('js-png')}>filter-js-png</button>
      <button onClick={() => setFilter('all')}>filter-all</button>
      <button onClick={() => setSort('extension')}>sort-extension</button>
    </div>
  );
}

function mockFetchOnce(fn) {
  global.fetch = vi.fn(fn);
}

describe('useDriveFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loads files with default sort=extension, order=asc, filter=all', async () => {
    mockFetchOnce(async (url) => {
      expect(String(url)).toContain('/api/files?');
      // Verify query params
      const u = new URL(String(url), 'http://localhost');
      expect(u.searchParams.get('sort')).toBe('extension');
      expect(u.searchParams.get('order')).toBe('asc');
      expect(u.searchParams.get('filter')).toBe('all');

      return {
        ok: true,
        json: async () => ({ files: [
          { id: '1', extension: '.js', filename: 'a.js' },
          { id: '2', extension: '.png', filename: 'b.png' },
        ] })
      };
    });

    render(<HookHarness />);

    // Wait for loading to complete and files to appear
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    const files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files).toHaveLength(2);
    expect(files[0].filename).toBe('a.js');
    expect(files[1].filename).toBe('b.png');
  });

  test('sorts by extension: ascending then descending (via order)', async () => {
    // Implementation returns different arrays based on the `order` param.
    mockFetchOnce(async (url) => {
      const u = new URL(String(url), 'http://localhost');
      const order = u.searchParams.get('order');
      const payload = order === 'desc'
        ? { files: [
            { id: '3', extension: '.png', filename: 'zz.png' },
            { id: '4', extension: '.js', filename: 'aa.js' },
          ] }
        : { files: [
            { id: '4', extension: '.js', filename: 'aa.js' },
            { id: '3', extension: '.png', filename: 'zz.png' },
          ] };
      return { ok: true, json: async () => payload };
    });

    render(<HookHarness />);

    // First load should be asc
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    let files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files.map(f => f.extension)).toEqual(['.js', '.png']);

    // Trigger descending order
    fireEvent.click(screen.getByText('order-desc'));

    await waitFor(() => {
      files = JSON.parse(screen.getByTestId('files').textContent);
      expect(files.map(f => f.extension)).toEqual(['.png', '.js']);
    });

    // Back to ascending
    fireEvent.click(screen.getByText('order-asc'));
    await waitFor(() => {
      files = JSON.parse(screen.getByTestId('files').textContent);
      expect(files.map(f => f.extension)).toEqual(['.js', '.png']);
    });
  });

  test('filters files to only .js and .png', async () => {
    mockFetchOnce(async (url) => {
      const u = new URL(String(url), 'http://localhost');
      const filter = u.searchParams.get('filter');

      if (filter === 'js-png') {
        return {
          ok: true,
          json: async () => ({ files: [
            { id: '1', extension: '.js', filename: 'a.js' },
            { id: '2', extension: '.png', filename: 'b.png' },
          ] })
        };
      }

      // Default (all)
      return {
        ok: true,
        json: async () => ({ files: [
          { id: '1', extension: '.js', filename: 'a.js' },
          { id: '2', extension: '.png', filename: 'b.png' },
          { id: '5', extension: '.txt', filename: 'c.txt' },
        ] })
      };
    });

    render(<HookHarness />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    let files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files.map(f => f.extension)).toEqual(['.js', '.png', '.txt']);

    // Apply filter to js/png only
    fireEvent.click(screen.getByText('filter-js-png'));

    await waitFor(() => {
      files = JSON.parse(screen.getByTestId('files').textContent);
      expect(files.map(f => f.extension)).toEqual(['.js', '.png']);
    });
  });

  test('handles API error and sets error message', async () => {
    mockFetchOnce(async () => ({
      ok: false,
      json: async () => ({ error: 'Не вдалося отримати файли (тест)' })
    }));

    render(<HookHarness />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('error').textContent).toMatch('Не вдалося отримати файли');
    const files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files).toEqual([]);
  });
});

