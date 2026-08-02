import { useRef, useState } from 'react';
import { UploadCloud, RefreshCw, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/services/uploadService';
import { resolveAssetUrl } from '@/utils/assets';

/**
 * Modern image uploader: click or drag & drop to upload, shows a thumbnail
 * preview with Change / Remove actions. Uploads to POST /uploads.
 *
 *   <ImageUpload value={profileImage} onChange={setUrl} onRemove={clear} label="Profile image" />
 */
export default function ImageUpload({ value, onChange, onRemove, label, hint = 'PNG, JPG or WEBP up to 2MB' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadImage(file);
      onChange?.(data?.data?.url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const src = value ? resolveAssetUrl(value) : null;

  return (
    <div>
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">{label}</span>}

      {src && !uploading ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 flex-shrink-0">
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Change photo
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6 text-slate-400" />
          )}
          <div className="text-center">
            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
              {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">{hint}</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
