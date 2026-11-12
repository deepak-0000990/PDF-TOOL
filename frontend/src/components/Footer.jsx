import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, FileText, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">PDF Toolkit</span>
            </div>
            <p className="text-slate-400 max-w-sm">
              The complete professional online PDF platform. Convert, organize, edit, sign, and enhance documents securely in your browser.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5 max-w-sm">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>100% Privacy Protected: Files are processed securely and deleted automatically.</span>
            </div>
          </div>

          {/* Column 1 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Organize</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tools/merge-pdf" className="hover:text-white transition">Merge PDF</Link></li>
              <li><Link to="/tools/split-pdf" className="hover:text-white transition">Split PDF</Link></li>
              <li><Link to="/tools/organize-pdf" className="hover:text-white transition">Organize Pages</Link></li>
              <li><Link to="/tools/rotate-pdf" className="hover:text-white transition">Rotate PDF</Link></li>
              <li><Link to="/tools/crop-pdf" className="hover:text-white transition">Crop PDF</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Convert</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tools/html-to-pdf" className="hover:text-white transition">HTML & URL to PDF</Link></li>
              <li><Link to="/tools/pdf-to-word" className="hover:text-white transition">PDF to Word</Link></li>
              <li><Link to="/tools/pdf-to-excel" className="hover:text-white transition">PDF to Excel</Link></li>
              <li><Link to="/tools/pdf-to-jpg" className="hover:text-white transition">PDF to JPG</Link></li>
              <li><Link to="/tools/jpg-to-pdf" className="hover:text-white transition">JPG to PDF</Link></li>
              <li><Link to="/tools/word-to-pdf" className="hover:text-white transition">Word to PDF</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-white font-semibold mb-3">Security & AI</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tools/sign-pdf" className="hover:text-white transition">Sign PDF</Link></li>
              <li><Link to="/tools/protect-pdf" className="hover:text-white transition">Protect PDF</Link></li>
              <li><Link to="/tools/unlock-pdf" className="hover:text-white transition">Unlock PDF</Link></li>
              <li><Link to="/tools/redact-pdf" className="hover:text-white transition">Redact PDF</Link></li>
              <li><Link to="/tools/compress-pdf" className="hover:text-white transition">Compress PDF</Link></li>
              <li><Link to="/tools/ai-summarizer" className="hover:text-white transition">AI Summarizer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PDF Toolkit. Built for professionals & teams.</p>
          <div className="flex items-center gap-4">
            <span>Server Status: Operational</span>
            <span>•</span>
            <span>End-to-End Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
