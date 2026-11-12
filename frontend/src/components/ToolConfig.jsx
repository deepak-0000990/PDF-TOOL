import React, { useRef, useState, useEffect } from 'react';
import { Pen, RefreshCw, Camera, Video, AlertCircle } from 'lucide-react';

export default function ToolConfig({ configType, config, setConfig, onAddCapturedImage }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  // Initialize canvas for signature drawing
  useEffect(() => {
    if (configType === 'sign-canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
    }
  }, [configType]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setConfig((prev) => ({ ...prev, signatureData: dataUrl }));
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setConfig((prev) => ({ ...prev, signatureData: null }));
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (onAddCapturedImage) onAddCapturedImage(file);
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  if (configType === 'html-url') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-800">Conversion Settings</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Webpage URL (or upload an HTML file above)
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={config.url || ''}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paper Format</label>
              <select
                value={config.format || 'A4'}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A3">A3 (Large)</option>
                <option value="Letter">US Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation</label>
              <select
                value={config.landscape ? 'landscape' : 'portrait'}
                onChange={(e) => setConfig({ ...config, landscape: e.target.value === 'landscape' })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bgGraphics"
              checked={config.printBackground !== false}
              onChange={(e) => setConfig({ ...config, printBackground: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="bgGraphics" className="text-xs text-slate-700 font-medium cursor-pointer">
              Print background graphics and colors
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (configType === 'split-mode') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Split Mode</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
            <input
              type="radio"
              name="splitMode"
              value="all"
              checked={config.mode !== 'range'}
              onChange={() => setConfig({ ...config, mode: 'all' })}
              className="text-blue-600"
            />
            <div>
              <p className="text-xs font-semibold text-slate-800">Split every page</p>
              <p className="text-[11px] text-slate-400">Extract every page into individual single-page PDF documents.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
            <input
              type="radio"
              name="splitMode"
              value="range"
              checked={config.mode === 'range'}
              onChange={() => setConfig({ ...config, mode: 'range' })}
              className="text-blue-600"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">Extract specific page range</p>
              <p className="text-[11px] text-slate-400">Specify pages to extract (e.g. "1-3, 5, 8")</p>
              {config.mode === 'range' && (
                <input
                  type="text"
                  placeholder="e.g. 1-3, 5"
                  value={config.pageRanges || ''}
                  onChange={(e) => setConfig({ ...config, pageRanges: e.target.value })}
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          </label>
        </div>
      </div>
    );
  }

  if (configType === 'rotate-angle') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Rotation Angle</h4>
        <div className="grid grid-cols-3 gap-3">
          {[90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => setConfig({ ...config, angle: deg })}
              className={`py-3 px-2 border rounded-xl text-center text-xs font-semibold transition ${
                (config.angle || 90) === deg
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              Rotate {deg}°
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (configType === 'crop-box') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Crop Margins (Points)</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">Top Margin</label>
            <input
              type="number"
              value={config.top || 0}
              onChange={(e) => setConfig({ ...config, top: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-1.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Bottom Margin</label>
            <input
              type="number"
              value={config.bottom || 0}
              onChange={(e) => setConfig({ ...config, bottom: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-1.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Left Margin</label>
            <input
              type="number"
              value={config.left || 0}
              onChange={(e) => setConfig({ ...config, left: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-1.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Right Margin</label>
            <input
              type="number"
              value={config.right || 0}
              onChange={(e) => setConfig({ ...config, right: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-1.5 border rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  if (configType === 'compress-level') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Compression Level</h4>
        <div className="space-y-2">
          {[
            { id: 'recommended', label: 'Recommended Compression', desc: 'Good quality, high file size reduction.' },
            { id: 'high', label: 'Extreme Compression', desc: 'Maximum size reduction, acceptable quality.' },
            { id: 'low', label: 'Low Compression', desc: 'Preserves maximum image and vector fidelity.' },
          ].map((lvl) => (
            <label
              key={lvl.id}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                (config.level || 'recommended') === lvl.id
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="compressLvl"
                value={lvl.id}
                checked={(config.level || 'recommended') === lvl.id}
                onChange={() => setConfig({ ...config, level: lvl.id })}
                className="text-blue-600"
              />
              <div>
                <p className="text-xs font-semibold text-slate-800">{lvl.label}</p>
                <p className="text-[11px] text-slate-400">{lvl.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (configType === 'watermark') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Watermark Configuration</h4>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Watermark Text</label>
            <input
              type="text"
              value={config.text || 'CONFIDENTIAL'}
              onChange={(e) => setConfig({ ...config, text: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Color</label>
              <input
                type="color"
                value={config.color || '#ff0000'}
                onChange={(e) => setConfig({ ...config, color: e.target.value })}
                className="w-full h-9 p-1 border rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Opacity: {Math.round((config.opacity || 0.3) * 100)}%</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.opacity || 0.3}
                onChange={(e) => setConfig({ ...config, opacity: parseFloat(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Angle: {config.rotation || -45}°</label>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={config.rotation || -45}
                onChange={(e) => setConfig({ ...config, rotation: parseInt(e.target.value, 10) })}
                className="w-full mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (configType === 'password-protect') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Encryption Password</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Set Document Password</label>
          <input
            type="password"
            placeholder="Enter secure password"
            value={config.password || ''}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  if (configType === 'password-unlock') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Unlock Password</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Password</label>
          <input
            type="password"
            placeholder="Enter current password to remove protection"
            value={config.password || ''}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  if (configType === 'redact') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Redaction Keywords</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Words or Phrases to Obliterate (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. Confidential, Secret, John Doe, 555-0199"
            value={config.keywords || ''}
            onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Underlying text & vectors are permanently removed, not just overlaid.
          </p>
        </div>
      </div>
    );
  }

  if (configType === 'sign-canvas') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">Draw Your Signature</h4>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Clear
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={400}
            height={140}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="bg-white rounded-lg shadow-inner cursor-crosshair max-w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Signer Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={config.signerName || ''}
              onChange={(e) => setConfig({ ...config, signerName: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Page</label>
            <input
              type="number"
              min="1"
              value={config.page || 1}
              onChange={(e) => setConfig({ ...config, page: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  if (configType === 'page-numbers') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Page Number Configuration</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Position</label>
            <select
              value={config.position || 'bottom-center'}
              onChange={(e) => setConfig({ ...config, position: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-white"
            >
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Format</label>
            <select
              value={config.format || 'Page {n} of {total}'}
              onChange={(e) => setConfig({ ...config, format: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-white"
            >
              <option value="Page {n} of {total}">Page 1 of 5</option>
              <option value="{n} / {total}">1 / 5</option>
              <option value="{n}">1</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (configType === 'camera-scan') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Camera Document Scanner</h4>
        {!cameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-2 transition"
          >
            <Camera className="w-4 h-4" />
            Enable Camera & Snap Pages
          </button>
        ) : (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black max-h-64 object-cover" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                📸 Capture Page
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (configType === 'ai-summary') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Summary Options</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Summary Mode</label>
          <select
            value={config.summaryType || 'comprehensive'}
            onChange={(e) => setConfig({ ...config, summaryType: e.target.value })}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
          >
            <option value="comprehensive">Comprehensive (Executive + Key Takeaways + Pages)</option>
            <option value="brief">Brief Executive Overview</option>
            <option value="bullets">Key Bullet Points Only</option>
          </select>
        </div>
      </div>
    );
  }

  if (configType === 'ai-translate') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Target Language</h4>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Language</label>
          <select
            value={config.targetLang || 'Spanish'}
            onChange={(e) => setConfig({ ...config, targetLang: e.target.value })}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
          >
            <option value="Spanish">Spanish (Español)</option>
            <option value="French">French (Français)</option>
            <option value="German">German (Deutsch)</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Chinese">Chinese (中文)</option>
            <option value="Japanese">Japanese (日本語)</option>
            <option value="Portuguese">Portuguese (Português)</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}
