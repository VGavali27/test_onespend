import { useRef, useState } from 'react';
import { Camera, X, Loader2, UserRound } from 'lucide-react';
import { uploadImage } from '@/services/uploadService';
import { resolveAssetUrl } from '@/utils/assets';

/**
 * Image picker with upload + preview + remove.
 * Defaults to a circular (headshot) style; pass `shape="square"` for a
 * company logo / thumbnail and an `icon` fallback (e.g. Building2).
 *
 *   <ImageUpload value={profileImage} onChange={setUrl} onRemove={clear} label="Profile image" />
 *   <ImageUpload shape="square" icon={Building2} value={logoImg} onChange={setLogo} onRemove={clear} label="Logo" />
 */
export default function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  hint = 'PNG, JPG or WEBP up to 2MB',
  shape = 'circle',
  icon: Icon = UserRound,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

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

  const src = value ? resolveAssetUrl(value) : null;
  const containerShape = shape === 'square' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">{label}</span>}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative w-28 h-28 ${containerShape} overflow-hidden border-2 border-dashed bg-slate-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : src
              ? 'border-transparent'
              : 'border-slate-300 dark:border-gray-700 hover:border-indigo-400'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        ) : src ? (
          <img src={src} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <Icon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        )}

        {/* Hover overlay — change photo */}
        {!uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Remove button */}
        {src && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!src && !uploading && <p className="text-[12px] text-slate-400 mt-2">{hint}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
