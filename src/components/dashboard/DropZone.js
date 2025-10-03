'use client';

import { useRef, useState } from 'react';

export default function DropZone({ onFilesAdded }) {
  const [highlight, setHighlight] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    onFilesAdded(Array.from(fileList));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setHighlight(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`drop-zone ${highlight ? 'drop-zone--active' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setHighlight(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setHighlight(false);
      }}
      onDrop={handleDrop}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <p>Перетягни файли сюди або клікни, щоб обрати</p>
      <span className="drop-zone__hint">Працює з кількома файлами одночасно.</span>
      
    </div>
  );
}
