import React, { useEffect } from 'react';
import { Download, ExternalLink, RefreshCw, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultCard({ result, onReset, toolTitle }) {
  useEffect(() => {
    // Fire confetti celebration on successful conversion
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseHost = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  const getFullUrl = (urlPath) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http')) return urlPath;
    return `${baseHost}${urlPath}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg max-w-2xl mx-auto space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Operation Completed Successfully!
        </h3>
        <p className="text-sm text-slate-500">
          {result.message || 'Your document has been processed and is ready for download.'}
        </p>
      </div>

      {/* Stats / Metadata badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        {result.filename && (
          <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-700 font-medium truncate max-w-xs">
            📄 {result.filename}
          </span>
        )}
        {result.size && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            {formatFileSize(result.size)}
          </span>
        )}
        {result.percentSaved !== undefined && (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold">
            🎉 Saved {result.percentSaved}%
          </span>
        )}
        {result.pageCount && (
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
            {result.pageCount} Pages
          </span>
        )}
      </div>

      {/* AI Summary Display if available */}
      {result.summary && (
        <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-700 text-sm">
            <Sparkles className="w-4 h-4" />
            AI Executive Summary
          </div>
          <p className="text-slate-700 leading-relaxed font-serif whitespace-pre-line">
            {result.summary.executive_summary}
          </p>

          {result.summary.key_points && result.summary.key_points.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-800">Key Takeaways:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {result.summary.key_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* PDF Comparison Report Display if available */}
      {result.pages && (
        <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs max-h-60 overflow-y-auto">
          <div className="font-bold text-slate-800 text-sm">
            Diff Analysis Report ({result.identical ? 'Identical' : 'Differences Found'})
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>Added Lines: <b className="text-emerald-600">+{result.totalAddedLines}</b></div>
            <div>Removed Lines: <b className="text-rose-600">-{result.totalRemovedLines}</b></div>
          </div>
          {result.pages.map((p, idx) => (
            <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">Page {p.page}: </span>
              {p.has_changes ? (
                <span className="text-amber-600 font-semibold">Modified ({p.added_lines} added, {p.removed_lines} removed)</span>
              ) : (
                <span className="text-emerald-600">Identical</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {result.downloadUrl && (
          <a
            href={getFullUrl(result.downloadUrl)}
            download={result.filename}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" />
            Download Output File
          </a>
        )}

        {result.filename && result.filename.endsWith('.pdf') && (
          <a
            href={getFullUrl(`/api/jobs/preview/${result.filename}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition"
          >
            <ExternalLink className="w-4 h-4" />
            Preview in New Tab
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Process Another
        </button>
      </div>
    </div>
  );
}
