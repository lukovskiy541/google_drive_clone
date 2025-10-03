import { insertFile, listFiles, getFileById, deleteFile, updateFileEditedBy } from './repositories/fileRepository.js';
import { ensureUserDirectories, saveFileBuffer, removeFile, readFileBuffer, writeTextToFile } from './fileStorage.js';
import { normaliseExtension, canPreviewAsText, canPreviewAsImage, getDefaultMime } from './utils/fileTypes.js';
import { runManualSync, ensureWatchers } from './syncService.js';

export async function uploadFileForUser(user, file) {
  ensureUserDirectories(user.id);
  ensureWatchers(user.id);

  const originalName = file.name ?? 'untitled';
  const extension = normaliseExtension(originalName);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { destination, storedName } = await saveFileBuffer(user.id, originalName, buffer);

  const inserted = insertFile({
    userId: user.id,
    filename: storedName,
    originalName,
    extension,
    mimeType: file.type || getDefaultMime(extension),
    storagePath: destination,
    sizeBytes: buffer.length,
    uploadedBy: user.display_name,
    editedBy: user.display_name
  });

  return inserted;
}

export function fetchFilesForUser(userId, options) {
  ensureWatchers(userId);
  return listFiles(userId, options);
}

export function removeFileForUser(userId, fileId) {
  const record = getFileById(fileId);
  if (!record || record.user_id !== userId) {
    return null;
  }

  removeFile(record.storage_path);
  deleteFile(fileId);
  return record;
}

export async function getPreviewPayload(userId, fileId) {
  const record = getFileById(fileId);
  if (!record || record.user_id !== userId) {
    return null;
  }

  const extension = record.extension;

  if (canPreviewAsText(extension)) {
    const buffer = await readFileBuffer(record.storage_path);
    return {
      type: 'text',
      content: buffer.toString('utf-8'),
      file: record
    };
  }

  if (canPreviewAsImage(extension)) {
    const buffer = await readFileBuffer(record.storage_path);
    return {
      type: 'image',
      content: buffer.toString('base64'),
      mime: record.mime_type,
      file: record
    };
  }

  return {
    type: 'unsupported',
    file: record
  };
}

export async function updateTextFile(user, fileId, content) {
  const record = getFileById(fileId);
  if (!record || record.user_id !== user.id) {
    return null;
  }

  if (!canPreviewAsText(record.extension)) {
    throw new Error('Only text previews can be edited');
  }

  await writeTextToFile(record.storage_path, content);
  const updated = updateFileEditedBy(fileId, user.display_name);
  return updated;
}

export async function triggerManualSync(userId) {
  return runManualSync(userId);
}
