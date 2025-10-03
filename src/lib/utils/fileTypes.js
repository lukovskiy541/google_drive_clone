const TEXT_EXTENSIONS = new Set(['.java']);
const IMAGE_EXTENSIONS = new Set(['.png']);

export function normaliseExtension(name) {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex === -1) {
    return '';
  }
  return name.substring(dotIndex).toLowerCase();
}

export function canPreviewAsText(extension) {
  return TEXT_EXTENSIONS.has(extension);
}

export function canPreviewAsImage(extension) {
  return IMAGE_EXTENSIONS.has(extension);
}

export function passesVariantFilter(extension, variant) {
  if (variant === 'js-png') {
    return extension === '.js' || extension === '.png';
  }
  return true;
}

export function getDefaultMime(extension) {
  if (extension === '.png') return 'image/png';
  if (extension === '.java') return 'text/plain';
  if (extension === '.js') return 'application/javascript';
  return 'application/octet-stream';
}
