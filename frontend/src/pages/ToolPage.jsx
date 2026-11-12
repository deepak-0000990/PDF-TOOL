import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TOOLS } from '../tools/toolRegistry';
import FileUpload from '../components/FileUpload';
import ToolConfig from '../components/ToolConfig';
import ResultCard from '../components/ResultCard';
import api from '../utils/api';
import { getToolIcon, AlertCircle, Loader2 } from '../utils/iconMap';

export default function ToolPage() {
  const { toolId } = useParams();
  const tool = TOOLS.find((t) => t.id === toolId);

  const [files, setFiles] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Update recent tools list in localStorage
  useEffect(() => {
    if (tool) {
      try {
        const raw = localStorage.getItem('recent_tools');
        let stored = [];
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) stored = parsed;
        }
        const updated = [tool.id, ...stored.filter((id) => id !== tool.id)].slice(0, 8);
        localStorage.setItem('recent_tools', JSON.stringify(updated));
      } catch (_) {}
    }
    // Reset state on tool change
    setFiles([]);
    setConfig({});
    setError(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toolId]);

  if (!tool) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-2xl font-bold text-slate-800">Tool Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested tool does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const IconComponent = getToolIcon(tool.icon);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (tool.id === 'html-to-pdf') {
      if (!config.url && files.length === 0) {
        setError('Please enter a webpage URL or upload an HTML file.');
        return;
      }
    } else if (tool.exactFiles && files.length !== tool.exactFiles) {
      setError(`Please upload exactly ${tool.exactFiles} files for this operation.`);
      return;
    } else if (tool.minFiles && files.length < tool.minFiles) {
      setError(`Please upload at least ${tool.minFiles} files.`);
      return;
    } else if (files.length === 0 && tool.id !== 'html-to-pdf') {
      setError('Please upload at least one document to proceed.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Append files
      if (files.length === 1) {
        formData.append('file', files[0]);
      } else if (files.length > 1) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Append config parameters
      Object.keys(config).forEach((key) => {
        if (config[key] !== undefined && config[key] !== null) {
          if (typeof config[key] === 'object') {
            formData.append(key, JSON.stringify(config[key]));
          } else {
            formData.append(key, config[key]);
          }
        }
      });

      const response = await api.post(tool.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response);
    } catch (err) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setConfig({});
    setError(null);
    setResult(null);
  };

  const handleAddCapturedImage = (imageFile) => {
    setFiles((prev) => [...prev, imageFile]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <span className="capitalize">{tool.category}</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{tool.title}</span>
      </nav>

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}
        >
          <IconComponent className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {tool.title}
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
              {tool.category}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Result Display or Upload Workspace */}
      {result ? (
        <ResultCard result={result} onReset={handleReset} toolTitle={tool.title} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <FileUpload
            files={files}
            setFiles={setFiles}
            accept={tool.accept}
            multiple={tool.multiple}
            minFiles={tool.minFiles || 1}
            title={`Select or drop ${tool.title} files`}
          />

          {/* Tool-specific configuration controls */}
          {tool.configType && tool.configType !== 'none' && (
            <ToolConfig
              configType={tool.configType}
              config={config}
              setConfig={setConfig}
              onAddCapturedImage={handleAddCapturedImage}
            />
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing document backend...</span>
                </>
              ) : (
                <>
                  <IconComponent className="w-5 h-5" />
                  <span>Execute {tool.title}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
