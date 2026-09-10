import { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollText, FileWarning, Activity, RefreshCw, Loader2, ArrowDownToLine } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import DatePicker from '@/components/ui/DatePicker';
import { getLogDates, getApiLogs, getErrorLogs } from '@/services/logsService';

const TABS = [
  { id: 'api', label: 'API Logs', icon: Activity, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
  { id: 'error', label: 'Error Logs', icon: FileWarning, accent: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
];

const LEVEL_BADGE = {
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  http: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  debug: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

// Scroll container — fetchers/effects scroll it to the bottom (most recent record).
function LogPanel({ title, icon: Icon, accent, entries, emptyLabel, scrollRef }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-gray-700">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h2>
        <span className="ml-auto text-xs text-slate-400">{entries.length} line(s)</span>
      </div>
      <div ref={scrollRef} className="max-h-[calc(100vh-340px)] overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800 scroll-smooth">
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">{emptyLabel}</p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="px-4 py-2.5 font-mono text-[12px] leading-relaxed">
              {e.level ? (
                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold mr-2 align-middle ${LEVEL_BADGE[e.level] || 'bg-slate-100 text-slate-600'}`}>
                  {e.level.toUpperCase()}
                </span>
              ) : null}
              {e.timestamp ? (
                <span className="text-slate-400 mr-2 align-middle">{e.timestamp}</span>
              ) : null}
              <span className={`whitespace-pre-wrap break-words ${e.level === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {e.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Logs() {
  const toast = useToast();
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState('');
  const [activeTab, setActiveTab] = useState('api'); // 'api' | 'error'
  const [entriesByTab, setEntriesByTab] = useState({ api: [], error: [] });
  const [loadingDates, setLoadingDates] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const entries = entriesByTab[activeTab] || [];
  const setEntries = useCallback((tab, list) =>
    setEntriesByTab((prev) => ({ ...prev, [tab]: list })), []);

  const loadDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      const { data: res } = await getLogDates();
      const list = res?.data ?? [];
      setDates(list);
      setDate((prev) => (list.length && !prev ? list[0] : prev));
      return list;
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load log dates');
      return [];
    } finally {
      setLoadingDates(false);
    }
  }, [toast]);

  const loadLogs = useCallback(async (d) => {
    if (!d) return;
    setLoading(true);
    try {
      // Active tab → its own dedicated endpoint.
      const { data: res } = activeTab === 'api'
        ? await getApiLogs({ date: d })
        : await getErrorLogs({ date: d });
      setEntries(activeTab, res?.data?.entries ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load logs');
      setEntries(activeTab, []);
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast, setEntries]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  // Fetch the active tab's logs when the date or tab changes, once a date is chosen.
  useEffect(() => {
    if (date) loadLogs(date);
  }, [date, activeTab, loadLogs]);

  // Scroll to the most recent (last) record once entries load or the tab changes.
  useEffect(() => {
    if (entries.length && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Application Logs</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              Server error &amp; request logs, bucketed by day
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker
            value={date}
            onChange={(v) => { if (v) setDate(v); }}
            maxDate={new Date()}
            placeholder="Select a date"
          />
          <button
            onClick={() => { loadDates(); if (date) loadLogs(date); }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs: API Logs | Error Logs */}
      <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-gray-800 p-1">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${active
                ? 'bg-white dark:bg-gray-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {entriesByTab[t.id]?.length ? (
                <span className="text-[11px] text-slate-400">({entriesByTab[t.id].length})</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Active tab's log panel + jump-to-latest */}
      {date ? (
        <div className="relative">
          {loading ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-5 w-40 bg-slate-100 dark:bg-gray-800 rounded mb-4" />
              {[...Array(8)].map((_, j) => (
                <div key={j} className="h-3 bg-slate-100 dark:bg-gray-800 rounded mb-2" />
              ))}
            </div>
          ) : (
            activeTab === 'api' ? (
              <LogPanel
                title="API Traffic (request logs)"
                icon={Activity}
                accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                entries={entries}
                emptyLabel="No request logs for this day."
                scrollRef={scrollRef}
              />
            ) : (
              <LogPanel
                title="Errors &amp; Warnings (error.log)"
                icon={FileWarning}
                accent="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                entries={entries}
                emptyLabel="No errors or warnings for this day."
                scrollRef={scrollRef}
              />
            )
          )}
          {!loading && entries.length > 0 ? (
            <button
              onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              title="Scroll to latest entry"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Latest
            </button>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">Select a date to view its logs.</div>
      )}
    </div>
  );
}