import fs from 'fs';
import path from 'path';
import { getSyncProfileByUserId } from './repositories/syncProfileRepository.js';

const DATA_ROOT = path.join(process.cwd(), 'data');
const REMOTE_ROOT = path.join(DATA_ROOT, 'storage');
const DEFAULT_LOCAL_ROOT = path.join(DATA_ROOT, 'local_sync');

async function resolveLocalDir(userId) {
  const profile = await getSyncProfileByUserId(userId);
  if (profile?.local_dir) {
    return profile.local_dir;
  }

  return path.join(DEFAULT_LOCAL_ROOT, userId);
}

export async function ensureUserDirectories(userId) {
  const remote = getRemoteDir(userId);
  const local = await getLocalDir(userId);

  await fs.promises.mkdir(remote, { recursive: true });
  await fs.promises.mkdir(local, { recursive: true });

  return { remote, local };
}

export function getRemoteDir(userId) {
  return path.join(REMOTE_ROOT, userId);
}

export async function getLocalDir(userId) {
  return resolveLocalDir(userId);
}

export function buildStoredName(originalName) {
  return path.basename(originalName);
}

function buildUniqueStoredName(userId, baseName) {
  const remoteDir = getRemoteDir(userId);
  const parsed = path.parse(baseName);
  let suffix = 0;
  let candidate = baseName;

  while (fs.existsSync(path.join(remoteDir, candidate))) {
    suffix += 1;
    const numbered = `${parsed.name} (${suffix})${parsed.ext}`;
    candidate = numbered;
  }

  return candidate;
}

export async function saveFileBuffer(userId, originalName, buffer) {
  await ensureUserDirectories(userId);
  const baseName = buildStoredName(originalName);
  const storedName = buildUniqueStoredName(userId, baseName);
  const destination = path.join(getRemoteDir(userId), storedName);

  await fs.promises.writeFile(destination, buffer);
  return { storedName, destination };
}

export function readFileBuffer(filePath) {
  return fs.promises.readFile(filePath);
}

export function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export async function writeTextToFile(filePath, content) {
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function streamFile(filePath) {
  return fs.createReadStream(filePath);
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function describeFileOnDisk(filePath) {
  const info = fs.statSync(filePath);
  return {
    size: info.size,
    createdAt: info.birthtime,
    updatedAt: info.mtime
  };
}
