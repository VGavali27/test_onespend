import { Type, MousePointerClick, Check, Monitor, Palette, Sun, Moon } from 'lucide-react';
import { useTheme, fontOptions, fontSizeOptions } from '../../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme, fontFamily, setFontFamily, fontSize, setFontSize } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Customize your display and appearance preferences</p>
        </div>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 sm:p-6 card-hover">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Appearance</h2>
              <p className="text-[11px] text-slate-400">Choose how the application looks</p>
            </div>
          </div>

          {/* Theme toggle card */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-gray-800 cursor-pointer" onClick={toggleTheme}>
            <div>
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">Theme Mode</p>
              <p className="text-[11px] text-slate-400">Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode</p>
            </div>
            <div className={`relative w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${theme === 'dark' ? 'left-5.5' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        {/* Font size */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 sm:p-6 card-hover">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MousePointerClick className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Font Size</h2>
              <p className="text-[11px] text-slate-400">Adjust text size across the app</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {fontSizeOptions.map((s) => (
              <button
                key={s.id}
                onClick={() => setFontSize(s.id)}
                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  fontSize === s.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-900/10'
                    : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white" style={{ fontSize: `${s.scale}px` }}>
                  Aa
                </span>
                <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{s.label}</span>
                <span className="text-[10px] text-slate-400">{s.scale}px</span>
                {fontSize === s.id && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font family — full width */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 sm:p-6 card-hover">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Type className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Font Family</h2>
            <p className="text-[11px] text-slate-400">Choose the typography style</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {fontOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setFontFamily(f.id)}
              className={`flex items-center justify-between p-4 rounded-lg border text-left transition-all cursor-pointer ${
                fontFamily === f.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-900/10'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate" style={{ fontFamily: f.family }}>
                  {f.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate" style={{ fontFamily: f.family }}>
                  The quick brown fox
                </p>
              </div>
              {fontFamily === f.id && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview — full width */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 sm:p-6 card-hover">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Type className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Live Preview</h2>
            <p className="text-[11px] text-slate-400">See your changes in real time</p>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-800">
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            The quick brown fox jumps over the lazy dog. 1234567890 ₹ ₹ ₹
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            This is how your selected font and size appear throughout the application.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
              Primary Button
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              Success
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Warning
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              Danger
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
