import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';

function runCommand(command, args, { treatCancelAsNull = false } = {}) {
  const result = spawnSync(command, args, { encoding: 'utf-8' });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      return { unavailable: true };
    }
    throw result.error;
  }

  if (result.status !== 0) {
    if (treatCancelAsNull) {
      return { cancelled: true };
    }

    const stderr = (result.stderr || '').trim();
    if (!stderr) {
      return { cancelled: true };
    }

    throw new Error(stderr);
  }

  const selected = (result.stdout || '').trim();
  if (!selected) {
    return { cancelled: true };
  }

  return { path: path.resolve(selected) };
}

function tryLinuxPicker() {
  const title = 'Оберіть папку для синхронізації';
  const candidates = [
    {
      command: 'zenity',
      args: ['--file-selection', '--directory', `--title=${title}`],
      treatCancelAsNull: true
    },
    {
      command: 'kdialog',
      args: ['--getexistingdirectory', os.homedir(), `--title=${title}`],
      treatCancelAsNull: true
    },
    {
      command: 'yad',
      args: ['--file-selection', '--directory', `--title=${title}`],
      treatCancelAsNull: true
    }
  ];

  for (const candidate of candidates) {
    const outcome = runCommand(candidate.command, candidate.args, {
      treatCancelAsNull: candidate.treatCancelAsNull
    });

    if (outcome.unavailable) {
      continue;
    }

    if (outcome.path) {
      return outcome;
    }

    if (outcome.cancelled) {
      return outcome;
    }
  }

  return { unavailable: true };
}

function pickOnMac() {
  const script = `set theFolder to choose folder with prompt "Оберіть папку для синхронізації"
POSIX path of theFolder`;
  return runCommand('osascript', ['-e', script], { treatCancelAsNull: true });
}

function pickOnWindows() {
  const script = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Оберіть папку для синхронізації'
$dialog.ShowNewFolderButton = $true
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
  exit 0
}
exit 1`;

  return runCommand(
    'powershell',
    ['-NoProfile', '-Command', script],
    { treatCancelAsNull: true }
  );
}

export function pickDirectoryViaSystem() {
  const platform = process.platform;

  if (platform === 'linux') {
    const outcome = tryLinuxPicker();
    if (outcome.path || outcome.cancelled) {
      return outcome;
    }
    throw new Error(
      'Не знайдено жодного графічного діалогу (zenity/kdialog/yad). Встановіть один із них або введіть шлях вручну.'
    );
  }

  if (platform === 'darwin') {
    return pickOnMac();
  }

  if (platform === 'win32') {
    return pickOnWindows();
  }

  throw new Error(`Платформа ${platform} не підтримується для вибору директорії.`);
}
