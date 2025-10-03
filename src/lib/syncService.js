import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import { formatISO } from 'date-fns';
import { ensureUserDirectories, getLocalDir, describeFileOnDisk } from './fileStorage.js';
import { getSyncProfileByUserId, upsertSyncProfile } from './repositories/syncProfileRepository.js';
import { upsertFileFromSync, getFileByPath } from './repositories/fileRepository.js';
import { findUserById } from './repositories/userRepository.js';
import { getLastSyncedAtForUser, setLastSyncedAtForUser } from './repositories/syncStateRepository.js';
import { normaliseExtension, getDefaultMime } from './utils/fileTypes.js';

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

const watchers = new Map();
const debounceTimers = new Map();

function disposeWatchers(userId) {
  const existing = watchers.get(userId);
  if (!existing) return;
  existing.remoteWatcher.close();
  existing.localWatcher.close();
  watchers.delete(userId);
}

function listFilesInDir(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => fs.statSync(path.join(dir, name)).isFile())
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        mtimeMs: stat.mtimeMs,
        birthtimeMs: stat.birthtimeMs,
        size: stat.size
      };
    });
}

function copyFileIfNewer(source, target) {
  if (!fs.existsSync(source)) return false;

  const sourceStat = fs.statSync(source);
  let shouldCopy = false;

  if (!fs.existsSync(target)) {
    shouldCopy = true;
  } else {
    const targetStat = fs.statSync(target);
    shouldCopy = sourceStat.mtimeMs > targetStat.mtimeMs;
  }

  if (shouldCopy) {
    fs.copyFileSync(source, target);
    fs.utimesSync(target, sourceStat.atime, sourceStat.mtime);
    return true;
  }

  return false;
}

function emitForUser(userId, payload) {
  emitter.emit(userId, payload);
}

async function syncUserNow(userId) {
  const user = findUserById(userId);
  if (!user) {
    return { changes: 0, lastSyncedAt: null };
  }

  const { remote, local } = ensureUserDirectories(userId);
  const remoteFiles = listFilesInDir(remote);
  const localFiles = listFilesInDir(local);

  const remoteNames = new Set(remoteFiles.map((f) => f.name));
  const localNames = new Set(localFiles.map((f) => f.name));

  let changes = 0;

  // Local -> Remote
  for (const localFile of localFiles) {
    const remoteTarget = path.join(remote, localFile.name);
    if (copyFileIfNewer(localFile.fullPath, remoteTarget)) {
      changes += 1;
    }
  }

  // Remote -> Local
  for (const remoteFile of remoteFiles) {
    const localTarget = path.join(local, remoteFile.name);
    if (copyFileIfNewer(remoteFile.fullPath, localTarget)) {
      changes += 1;
    }
  }

  const timestamp = new Date().toISOString();
  setLastSyncedAtForUser(userId, timestamp);

  if (changes > 0) {
    for (const remoteFile of listFilesInDir(remote)) {
      const extension = normaliseExtension(remoteFile.name);
      const storagePath = path.join(remote, remoteFile.name);
      const stats = describeFileOnDisk(storagePath);

      upsertFileFromSync(userId, {
        filename: remoteFile.name,
        originalName: remoteFile.name,
        extension,
        mimeType: getDefaultMime(extension),
        storagePath,
        sizeBytes: stats.size,
        uploadedBy: user.display_name,
        editedBy: user.display_name,
        createdAt: formatISO(stats.createdAt),
        updatedAt: formatISO(stats.updatedAt)
      });
    }

    emitForUser(userId, { type: 'synced', at: timestamp });
  }

  return { changes, lastSyncedAt: timestamp };
}

function scheduleSync(userId) {
  if (debounceTimers.has(userId)) {
    clearTimeout(debounceTimers.get(userId));
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(userId);
    syncUserNow(userId).catch((err) => {
      console.error('Sync error', err);
    });
  }, 300);

  debounceTimers.set(userId, timer);
}

export function ensureWatchers(userId) {
  if (watchers.has(userId)) {
    return watchers.get(userId);
  }

  const { remote, local } = ensureUserDirectories(userId);

  const remoteWatcher = chokidar.watch(remote, { ignoreInitial: true, depth: 0 });
  const localWatcher = chokidar.watch(local, { ignoreInitial: true, depth: 0 });

  const handler = () => scheduleSync(userId);

  remoteWatcher.on('add', handler).on('change', handler).on('unlink', handler);
  localWatcher.on('add', handler).on('change', handler).on('unlink', handler);

  const cleanup = () => {
    disposeWatchers(userId);
  };

  watchers.set(userId, { remoteWatcher, localWatcher, cleanup });
  return watchers.get(userId);
}

export function subscribeToSync(userId, callback) {
  const listener = (payload) => callback(payload);
  emitter.on(userId, listener);

  return () => {
    emitter.off(userId, listener);
  };
}

export async function runManualSync(userId) {
  return syncUserNow(userId);
}

export function touchFileRecord(userId, storagePath) {
  const record = getFileByPath(userId, storagePath);
  if (!record) return null;
  emitForUser(userId, { type: 'updated', fileId: record.id });
  return record;
}

export function getEffectiveLocalSyncDir(userId) {
  const profile = getSyncProfileByUserId(userId);
  const effectiveDir = getLocalDir(userId);
  return {
    localDir: effectiveDir,
    isCustom: Boolean(profile?.local_dir)
  };
}

export function getLastSyncTimestamp(userId) {
  return getLastSyncedAtForUser(userId);
}

export async function updateLocalSyncDir(userId, targetDir) {
  const resolvedDir = path.resolve(targetDir);

  const existing = fs.existsSync(resolvedDir) ? fs.statSync(resolvedDir) : null;
  if (existing && !existing.isDirectory()) {
    throw new Error('Target path is not a directory');
  }

  upsertSyncProfile(userId, resolvedDir);
  ensureUserDirectories(userId);
  disposeWatchers(userId);
  ensureWatchers(userId);
  const { lastSyncedAt } = await syncUserNow(userId);

  return {
    profile: {
      localDir: resolvedDir,
      isCustom: true
    },
    lastSyncedAt
  };
}
