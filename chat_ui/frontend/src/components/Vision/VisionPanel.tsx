'use client';

/**
 * Vision Inspector Panel
 *
 * Features:
 * - Image/document upload for VLM analysis
 * - OCR text extraction
 * - Equipment identification from photos
 * - Blueprint/schematic analysis
 */

import { useState, useCallback, useRef } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Scan,
  Eye,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileSearch,
  Clipboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './VisionPanel.module.css';

type AnalysisMode = 'equipment' | 'ocr' | 'blueprint' | 'general';

interface AnalysisResult {
  mode: AnalysisMode;
  content: string;
  confidence?: number;
  extractedData?: Record<string, string>;
  timestamp: Date;
}

export default function VisionPanel() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('equipment');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image (JPEG, PNG, GIF, WebP) or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFileName(file.name);
    setError(null);
    setResult(null);

    // Convert to base64 for preview and API
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'vision',
          image: selectedImage,
          messages: [
            {
              role: 'user',
              content: getPromptForMode(analysisMode),
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.success || data.content) {
        setResult({
          mode: analysisMode,
          content: data.content || data.message || 'Analysis complete',
          confidence: data.confidence,
          extractedData: data.extractedData,
          timestamp: new Date(),
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, analysisMode]);

  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setSelectedFileName('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCopyResult = useCallback(() => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
    }
  }, [result]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Camera size={20} />
        </div>
        <div className={styles.headerText}>
          <h2>Vision Inspector</h2>
          <p>Upload images for AI analysis</p>
        </div>
      </div>

      {/* Analysis Mode Selection */}
      <div className={styles.modeSection}>
        <div className={styles.modeLabel}>Analysis Mode</div>
        <div className={styles.modeGrid}>
          <button
            className={cn(styles.modeBtn, analysisMode === 'equipment' && styles.modeActive)}
            onClick={() => setAnalysisMode('equipment')}
          >
            <Camera size={16} />
            <span>Equipment ID</span>
          </button>
          <button
            className={cn(styles.modeBtn, analysisMode === 'ocr' && styles.modeActive)}
            onClick={() => setAnalysisMode('ocr')}
          >
            <Scan size={16} />
            <span>OCR Extract</span>
          </button>
          <button
            className={cn(styles.modeBtn, analysisMode === 'blueprint' && styles.modeActive)}
            onClick={() => setAnalysisMode('blueprint')}
          >
            <FileSearch size={16} />
            <span>Blueprint</span>
          </button>
          <button
            className={cn(styles.modeBtn, analysisMode === 'general' && styles.modeActive)}
            onClick={() => setAnalysisMode('general')}
          >
            <Eye size={16} />
            <span>General</span>
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={cn(styles.uploadArea, selectedImage && styles.hasImage)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {selectedImage ? (
          <div className={styles.imagePreview}>
            <img src={selectedImage} alt="Preview" className={styles.previewImage} />
            <button className={styles.clearBtn} onClick={handleClear} title="Clear">
              <X size={16} />
            </button>
            <div className={styles.fileName}>{selectedFileName}</div>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <div className={styles.uploadIcon}>
              <Upload size={32} />
            </div>
            <p className={styles.uploadText}>
              Drag & drop an image or document here
            </p>
            <p className={styles.uploadSubtext}>
              JPEG, PNG, WebP, PDF (max 10MB)
            </p>
            <label className={styles.uploadBtn}>
              <ImageIcon size={16} />
              <span>Choose File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Analyze Button */}
      {selectedImage && (
        <button
          className={styles.analyzeBtn}
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className={styles.spinner} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Eye size={18} />
              <span>Analyze with VLM</span>
            </>
          )}
        </button>
      )}

      {/* Results Display */}
      {result && (
        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <CheckCircle size={16} className={styles.successIcon} />
            <span>Analysis Complete</span>
            <button
              className={styles.copyBtn}
              onClick={handleCopyResult}
              title="Copy to clipboard"
            >
              <Clipboard size={14} />
            </button>
          </div>
          <div className={styles.resultContent}>
            {result.content}
          </div>
          {result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className={styles.extractedData}>
              <div className={styles.extractedLabel}>Extracted Data</div>
              <div className={styles.dataGrid}>
                {Object.entries(result.extractedData).map(([key, value]) => (
                  <div key={key} className={styles.dataItem}>
                    <span className={styles.dataKey}>{key}:</span>
                    <span className={styles.dataValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.confidence !== undefined && (
            <div className={styles.confidence}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span>Powered by Qwen VL + Claude</span>
      </div>
    </div>
  );
}

// Get analysis prompt based on mode
function getPromptForMode(mode: AnalysisMode): string {
  switch (mode) {
    case 'equipment':
      return `Identify the equipment in this image. Extract:
        - Equipment type (e.g., HVAC unit, electrical panel, water heater)
        - Brand/manufacturer if visible
        - Model number if visible
        - Serial number if visible
        - Estimated age/condition
        - Any visible issues or damage
        Format as structured data.`;
    case 'ocr':
      return `Extract ALL text visible in this image. Include:
        - Serial numbers
        - Model numbers
        - Nameplate data
        - Labels and stickers
        - Any other readable text
        Format as structured text.`;
    case 'blueprint':
      return `Analyze this blueprint/schematic. Identify:
        - Type of system (HVAC, electrical, plumbing, etc.)
        - Key components shown
        - Dimensions if visible
        - Any specifications or notes
        - Potential issues or concerns
        Provide a summary suitable for a field technician.`;
    case 'general':
    default:
      return `Describe what you see in this image in detail. If it appears to be MEP (mechanical, electrical, plumbing) or construction related, provide relevant technical observations.`;
  }
}
