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

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    const files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files).toHaveLength(2);
    expect(files[0].filename).toBe('a.js');
    expect(files[1].filename).toBe('b.png');
  });

  test('sorts by extension: ascending then descending (via order)', async () => {
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
 
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    let files = JSON.parse(screen.getByTestId('files').textContent);
    expect(files.map(f => f.extension)).toEqual(['.js', '.png']);

    fireEvent.click(screen.getByText('order-desc'));

    await waitFor(() => {
      files = JSON.parse(screen.getByTestId('files').textContent);
      expect(files.map(f => f.extension)).toEqual(['.png', '.js']);
    });

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

  test('refetches with updated query params when switching sort order and filter', async () => {
    const requests = [];
    global.fetch = vi.fn(async (url) => {
      const u = new URL(String(url), 'http://localhost');
      requests.push(Object.fromEntries(u.searchParams.entries()));
      return {
        ok: true,
        json: async () => ({ files: [] })
      };
    });

    render(<HookHarness />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(requests[0]).toMatchObject({ sort: 'extension', order: 'asc', filter: 'all' });

    fireEvent.click(screen.getByText('order-desc'));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1]).toMatchObject({ sort: 'extension', order: 'desc', filter: 'all' });

    fireEvent.click(screen.getByText('filter-js-png'));
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2]).toMatchObject({ sort: 'extension', order: 'desc', filter: 'js-png' });
  });
});
