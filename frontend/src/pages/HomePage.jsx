import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Shield, Zap, FileCheck, Layers } from 'lucide-react';
import { TOOLS, TOOL_CATEGORIES } from '../tools/toolRegistry';
import ToolCard from '../components/ToolCard';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentToolIds, setRecentToolIds] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent_tools');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentToolIds(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const popularTools = useMemo(() => TOOLS.filter((t) => t.popular), []);
  const recentTools = useMemo(() => {
    if (!Array.isArray(recentToolIds)) return [];
    return recentToolIds
      .map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean)
      .slice(0, 4);
  }, [recentToolIds]);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Online PDF Utility Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Every PDF Tool You Need <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            in One Place
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Convert, edit, organize, compress, sign, and enhance PDF documents securely in your browser. Real processing backend with no limitations.
        </p>

        {/* Live Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 32 PDF tools (e.g. merge, word, watermark, html)..."
            className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base bg-white border border-slate-300 rounded-2xl shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Recently Used Tools */}
      {recentTools.length > 0 && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recently Used Tools</h2>
            <button
              onClick={() => {
                localStorage.removeItem('recent_tools');
                setRecentToolIds([]);
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear history
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTools.map((tool) => (
              <ToolCard key={`recent-${tool.id}`} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Tools Section */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Popular PDF Tools</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Top Picks
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularTools.map((tool) => (
              <ToolCard key={`popular-${tool.id}`} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Category Tabs & All PDF Tools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">All PDF Tools</h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
            <p className="text-slate-500 text-sm">No tools matched your search query "{searchQuery}".</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-14 shadow-sm text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            How It Works
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-12">
            Powerful document processing engineered for simplicity and privacy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Select or Upload</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Choose any tool and drag-and-drop your documents, enter a URL, or snap photos with your device camera.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Configure & Process</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Fine-tune conversion parameters, select pages, add signatures or watermarks, and run the backend engine.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Download Securely</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Download your output file or archive instantly. Temporary files are automatically purged after processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Features Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Zero Data Retention</h4>
              <p className="text-xs text-slate-500">Your documents are processed in memory & purged automatically.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">High-Speed Engines</h4>
              <p className="text-xs text-slate-500">Built on Node.js pdf-lib, Playwright Chromium & Python PyMuPDF.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">ISO Standard Compliant</h4>
              <p className="text-xs text-slate-500">Compatible with Adobe Acrobat, PDF/A archiving & veraPDF.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
