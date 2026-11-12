import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Layers, RefreshCw, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              PDF<span className="text-blue-600">Toolkit</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              PRO
            </span>
          </div>
        </Link>

        {/* Navigation Categories */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <Link
            to="/#organize"
            className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
          >
            Organize
          </Link>
          <Link
            to="/#convert"
            className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
          >
            Convert
          </Link>
          <Link
            to="/#edit"
            className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
          >
            Edit & Sign
          </Link>
          <Link
            to="/#processing"
            className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
          >
            Compress & OCR
          </Link>
          <Link
            to="/#ai"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-purple-600 bg-purple-50/60 hover:bg-purple-100/60 transition"
          >
            <Sparkles className="w-4 h-4" />
            AI Tools
          </Link>
        </nav>

        {/* Quick Action */}
        <div className="flex items-center gap-3">
          <Link
            to="/tools/html-to-pdf"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            URL to PDF
          </Link>
          <Link
            to="/tools/merge-pdf"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            Merge PDF
          </Link>
        </div>
      </div>
    </header>
  );
}
