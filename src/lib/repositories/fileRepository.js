import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import db from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 18);

const SORT_COLUMNS = {
  extension: 'extension',
  name: 'filename',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

export function insertFile({
  userId,
  filename,
  originalName,
  extension,
  mimeType,
  storagePath,
  sizeBytes,
  uploadedBy,
  editedBy
}) {
  const id = nanoid();
  const timestamp = formatISO(new Date());

  const stmt = db.prepare(`
    INSERT INTO files (
      id,
      user_id,
      filename,
      original_name,
      extension,
      mime_type,
      storage_path,
      size_bytes,
      uploaded_by,
      edited_by,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @user_id,
      @filename,
      @original_name,
      @extension,
      @mime_type,
      @storage_path,
      @size_bytes,
      @uploaded_by,
      @edited_by,
      @created_at,
      @updated_at
    )
  `);

  stmt.run({
    id,
    user_id: userId,
    filename,
    original_name: originalName,
    extension,
    mime_type: mimeType,
    storage_path: storagePath,
    size_bytes: sizeBytes,
    uploaded_by: uploadedBy,
    edited_by: editedBy,
    created_at: timestamp,
    updated_at: timestamp
  });

  return getFileById(id);
}

export function listFiles(userId, { sort = 'extension', order = 'asc', filter = 'all' } = {}) {
  const column = SORT_COLUMNS[sort] ?? SORT_COLUMNS.extension;
  const safeOrder = order === 'desc' ? 'DESC' : 'ASC';

  let filterClause = '';
  if (filter === 'js-png') {
    filterClause = "AND (extension = '.js' OR extension = '.png')";
  }

  const stmt = db.prepare(`
    SELECT * FROM files
    WHERE user_id = @user_id ${filterClause}
    ORDER BY ${column} ${safeOrder}
  `);

  return stmt.all({ user_id: userId });
}

export function getFileById(id) {
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  return stmt.get(id) ?? null;
}

export function getFileByPath(userId, storagePath) {
  const stmt = db.prepare('SELECT * FROM files WHERE user_id = ? AND storage_path = ?');
  return stmt.get(userId, storagePath) ?? null;
}

export function updateFileMetadata(id, updates) {
  const existing = getFileById(id);
  if (!existing) return null;

  const next = {
    ...existing,
    ...updates,
    updated_at: updates.updated_at ?? formatISO(new Date())
  };

  const stmt = db.prepare(`
    UPDATE files SET
      filename = @filename,
      original_name = @original_name,
      extension = @extension,
      mime_type = @mime_type,
      storage_path = @storage_path,
      size_bytes = @size_bytes,
      uploaded_by = @uploaded_by,
      edited_by = @edited_by,
      created_at = @created_at,
      updated_at = @updated_at
    WHERE id = @id
  `);

  stmt.run(next);
  return getFileById(id);
}

export function updateFileEditedBy(id, editedBy) {
  const timestamp = formatISO(new Date());
  const stmt = db.prepare('UPDATE files SET edited_by = ?, updated_at = ? WHERE id = ?');
  stmt.run(editedBy, timestamp, id);
  return getFileById(id);
}

export function deleteFile(id) {
  const stmt = db.prepare('DELETE FROM files WHERE id = ?');
  stmt.run(id);
}

export function upsertFileFromSync(userId, payload) {
  const existing = getFileByPath(userId, payload.storagePath);

  if (!existing) {
    return insertFile({
      userId,
      filename: payload.filename,
      originalName: payload.originalName ?? payload.filename,
      extension: payload.extension,
      mimeType: payload.mimeType,
      storagePath: payload.storagePath,
      sizeBytes: payload.sizeBytes,
      uploadedBy: payload.uploadedBy,
      editedBy: payload.editedBy
    });
  }

  return updateFileMetadata(existing.id, {
    filename: payload.filename,
    original_name: payload.originalName ?? payload.filename,
    extension: payload.extension,
    mime_type: payload.mimeType,
    storage_path: payload.storagePath,
    size_bytes: payload.sizeBytes,
    uploaded_by: payload.uploadedBy,
    edited_by: payload.editedBy,
    created_at: payload.createdAt ?? existing.created_at,
    updated_at: payload.updatedAt ?? existing.updated_at
  });
}
