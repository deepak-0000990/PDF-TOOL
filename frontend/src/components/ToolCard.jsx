import React from 'react';
import { Link } from 'react-router-dom';
import { getToolIcon, ArrowRight } from '../utils/iconMap';

export default function ToolCard({ tool }) {
  const IconComponent = getToolIcon(tool.icon);

  return (
    <Link
      to={`/tools/${tool.id}`}
      className="group relative flex flex-col justify-between p-6 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all duration-200"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {tool.popular && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Popular
            </span>
          )}
        </div>

        <h3 className="font-semibold text-base text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
          {tool.title}
        </h3>

        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
        <span>Use Tool</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </div>
    </Link>
  );
}
