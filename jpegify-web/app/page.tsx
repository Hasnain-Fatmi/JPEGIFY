'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Zap, Image as ImageIcon, BarChart3, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, decompressImage, calculatePSNR } from '@/lib/jpeg-compression';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [compressedImage, setCompressedImage] = useState<ImageData | null>(null);
  const [quality, setQuality] = useState(50);
  const [forceGrayscale, setForceGrayscale] = useState(false);
  const [stats, setStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    psnr: number;
    processingTime: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedData, setCompressedData] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setCompressedImage(null);
        setStats(null);
        setCompressedData(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const getImageData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  };

  const handleCompress = useCallback(async () => {
    if (!originalImage) return;

    setIsCompressing(true);
    const startTime = performance.now();

    // Small delay to show animation
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const imageData = getImageData(originalImage);
      const result = compressImage(imageData, quality, forceGrayscale);

      // Decompress for display
      const decompressed = decompressImage(result.compressedData);
      const psnr = calculatePSNR(imageData, decompressed.imageData);

      const processingTime = performance.now() - startTime;

      setCompressedImage(decompressed.imageData);
      setCompressedData(result.compressedData);
      setStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        psnr,
        processingTime
      });
    } catch (error) {
      console.error('Compression error:', error);
      alert('Error during compression. Please try another image.');
    } finally {
      setIsCompressing(false);
    }
  }, [originalImage, quality, forceGrayscale]);

  const handleDownload = useCallback(() => {
    if (!compressedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = compressedImage.width;
    canvas.height = compressedImage.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(compressedImage, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed-q${quality}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }, [compressedImage, quality]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">JPEGIFY</h1>
                <p className="text-xs text-purple-300">Advanced Image Compression</p>
              </div>
            </div>
            <a
              href="https://github.com/Hasnain-Fatmi/JPEGIFY"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">View on GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!originalImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl font-bold text-white mb-4">
                Image Compresser
              </h2>
              <p className="text-xl text-purple-200 mb-8">
                Experience the power of JPEG compression with real-time DCT, quantization, and Huffman encoding
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-purple-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  DCT Transform
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Quantization
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  RLE & Huffman Coding
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Chroma Subsampling
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`relative ${originalImage ? 'mb-8' : 'mb-0'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {!originalImage && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-400 bg-purple-500/20 scale-105'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-400'
              }`}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Drop your image here
                </h3>
                <p className="text-purple-200">
                  or click to browse • PNG, JPG, BMP supported
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Controls & Preview */}
        {originalImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Control Panel */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-purple-300 mt-1">
                    <span>High Compression</span>
                    <span>High Quality</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceGrayscale}
                      onChange={(e) => setForceGrayscale(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 accent-purple-500"
                    />
                    <span className="text-sm">Grayscale</span>
                  </label>

                  <button
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCompressing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Compress
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>New Image</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Compression Statistics</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-purple-300 mb-1">Original Size</p>
                    <p className="text-xl font-bold text-white">{formatBytes(stats.originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300 mb-1">Compressed Size</p>
                    <p className="text-xl font-bold text-white">{formatBytes(stats.compressedSize)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300 mb-1">Compression Ratio</p>
                    <p className="text-xl font-bold text-green-400">{stats.compressionRatio.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300 mb-1">PSNR</p>
                    <p className="text-xl font-bold text-blue-400">{stats.psnr.toFixed(2)} dB</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300 mb-1">Processing Time</p>
                    <p className="text-xl font-bold text-pink-400">{stats.processingTime.toFixed(0)} ms</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Image Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Original Image</h3>
                <div className="relative aspect-square bg-black/20 rounded-lg overflow-hidden">
                  <img
                    src={originalImage.src}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-purple-300 mt-2">
                  {originalImage.width} × {originalImage.height} px
                </p>
              </div>

              {/* Compressed Image */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Compressed Image</h3>
                  {compressedImage && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                </div>
                <div className="relative aspect-square bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                  {compressedImage ? (
                    <img
                      src={(() => {
                        const canvas = document.createElement('canvas');
                        canvas.width = compressedImage.width;
                        canvas.height = compressedImage.height;
                        const ctx = canvas.getContext('2d')!;
                        ctx.putImageData(compressedImage, 0, 0);
                        return canvas.toDataURL();
                      })()}
                      alt="Compressed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-purple-300">Click "Compress" to see result</p>
                  )}
                </div>
                {compressedImage && (
                  <p className="text-sm text-purple-300 mt-2">
                    {compressedImage.width} × {compressedImage.height} px
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-purple-300">
            <p className="text-sm">
              Built with Next.js, TypeScript, and Tailwind CSS • Implementing full JPEG compression algorithm
            </p>
            <p className="text-xs mt-2 text-purple-400">
              DCT • Quantization • Zigzag Scan • RLE • Huffman Coding • Chroma Subsampling
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
