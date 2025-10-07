import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import { query } from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 18);

const SORT_COLUMNS = {
  extension: 'extension',
  name: 'filename',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

function normaliseFileRow(row) {
  if (!row) return null;

  return {
    ...row,
    size_bytes: row.size_bytes == null ? row.size_bytes : Number(row.size_bytes)
  };
}

export async function insertFile({
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

  const { rows } = await query(
    `
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `,
    [
      id,
      userId,
      filename,
      originalName,
      extension,
      mimeType,
      storagePath,
      sizeBytes,
      uploadedBy,
      editedBy,
      timestamp,
      timestamp
    ]
  );

  return normaliseFileRow(rows[0]);
}

export async function listFiles(userId, { sort = 'extension', order = 'asc', filter = 'all' } = {}) {
  const column = SORT_COLUMNS[sort] ?? SORT_COLUMNS.extension;
  const safeOrder = order === 'desc' ? 'DESC' : 'ASC';

  const params = [userId];
  let filterClause = '';

  if (filter === 'js-png') {
    filterClause = 'AND extension = ANY($2::text[])';
    params.push(['.js', '.png']);
  }

  const { rows } = await query(
    `
      SELECT * FROM files
      WHERE user_id = $1 ${filterClause}
      ORDER BY ${column} ${safeOrder}
    `,
    params
  );

  return rows.map(normaliseFileRow);
}

export async function getFileById(id) {
  const { rows } = await query('SELECT * FROM files WHERE id = $1', [id]);
  return normaliseFileRow(rows[0]);
}

export async function getFileByPath(userId, storagePath) {
  const { rows } = await query('SELECT * FROM files WHERE user_id = $1 AND storage_path = $2', [userId, storagePath]);
  return normaliseFileRow(rows[0]);
}

export async function updateFileMetadata(id, updates) {
  const existing = await getFileById(id);
  if (!existing) return null;

  const next = {
    ...existing,
    ...updates,
    size_bytes: updates.size_bytes ?? updates.sizeBytes ?? existing.size_bytes,
    updated_at: updates.updated_at ?? formatISO(new Date())
  };

  const params = [
    next.filename,
    next.original_name,
    next.extension,
    next.mime_type,
    next.storage_path,
    next.size_bytes,
    next.uploaded_by,
    next.edited_by,
    next.created_at,
    next.updated_at,
    id
  ];

  const { rows } = await query(
    `
      UPDATE files SET
        filename = $1,
        original_name = $2,
        extension = $3,
        mime_type = $4,
        storage_path = $5,
        size_bytes = $6,
        uploaded_by = $7,
        edited_by = $8,
        created_at = $9,
        updated_at = $10
      WHERE id = $11
      RETURNING *
    `,
    params
  );

  return normaliseFileRow(rows[0]);
}

export async function updateFileEditedBy(id, editedBy) {
  const timestamp = formatISO(new Date());
  const { rows } = await query(
    'UPDATE files SET edited_by = $1, updated_at = $2 WHERE id = $3 RETURNING *',
    [editedBy, timestamp, id]
  );

  return normaliseFileRow(rows[0]);
}

export async function deleteFile(id) {
  await query('DELETE FROM files WHERE id = $1', [id]);
}

export async function upsertFileFromSync(userId, payload) {
  const existing = await getFileByPath(userId, payload.storagePath);

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
