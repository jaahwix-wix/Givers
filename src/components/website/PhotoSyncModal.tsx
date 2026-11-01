/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  FolderPlus,
  AlertCircle,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { 
  ATTACHED_SCHOOL_PHOTOS, 
  getSchoolPhotoSrc, 
  isPhotoSynced, 
  saveSchoolPhoto, 
  clearStoredSchoolPhotos,
  onSchoolPhotosUpdated 
} from '../../utils/photoManager';

interface PhotoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoSyncModal({ isOpen, onClose }: PhotoSyncModalProps) {
  const [syncedMap, setSyncedMap] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSyncStatus = () => {
    const map: Record<string, boolean> = {};
    ATTACHED_SCHOOL_PHOTOS.forEach(p => {
      map[p.filename] = isPhotoSynced(p.filename);
    });
    setSyncedMap(map);
  };

  useEffect(() => {
    refreshSyncStatus();
    const unsub = onSchoolPhotosUpdated(refreshSyncStatus);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const totalSynced = Object.values(syncedMap).filter(Boolean).length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    let savedCount = 0;
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Find matching photo by exact name or match by index if names differ
      let target = ATTACHED_SCHOOL_PHOTOS.find(p => 
        p.filename.toLowerCase() === file.name.toLowerCase()
      );

      // If exact name didn't match, check if name contains WA00XX or WA002X
      if (!target) {
        const match = file.name.match(/WA002\d/i);
        if (match) {
          target = ATTACHED_SCHOOL_PHOTOS.find(p => 
            p.filename.toLowerCase().includes(match[0].toLowerCase())
          );
        }
      }

      // If still not matched, assign to first unsynced photo
      if (!target) {
        target = ATTACHED_SCHOOL_PHOTOS.find(p => !syncedMap[p.filename]);
      }

      if (target) {
        try {
          const base64 = await readFileAsDataUrl(file);
          saveSchoolPhoto(target.filename, base64);
          savedCount++;
        } catch (err) {
          console.error('Failed reading file', file.name, err);
        }
      }
    }

    refreshSyncStatus();
    setIsProcessing(false);
    setSuccessMsg(`Successfully synced ${savedCount} authentic school photos to the website!`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const [isResetConfirming, setIsResetConfirming] = useState(false);

  const handleReset = () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      setTimeout(() => setIsResetConfirming(false), 4000);
      return;
    }
    clearStoredSchoolPhotos();
    refreshSyncStatus();
    setIsResetConfirming(false);
    setSuccessMsg('Reset all synced photos back to defaults.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Camera className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Real Campus Photos Manager
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Replace all AI-generated photos with your 10 attached WhatsApp photos from Kambia 1
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="my-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-emerald-950">
              Synced: <span className="font-black text-emerald-700">{totalSynced} of 10 Photos Active</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalSynced > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetConfirming ? 'Click Again to Reset' : 'Reset'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Photos from Device</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer mb-6"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs mx-auto flex items-center justify-center text-emerald-600 mb-2 border border-slate-200">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-black text-slate-800">
            Drag & Drop Your 10 Attached WhatsApp Photos Here
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Supports <code className="text-emerald-700 font-mono">IMG-20260918-WA0020.jpg</code> to <code className="text-emerald-700 font-mono">WA0029.jpg</code>. They will immediately replace all generated images across the entire website!
          </p>
        </div>

        {/* Grid of 10 Attached Photos */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Attached Photos Roster (10 Photos)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ATTACHED_SCHOOL_PHOTOS.map((photo, idx) => {
              const isSynced = syncedMap[photo.filename];
              const imgSrc = getSchoolPhotoSrc(photo.filename);

              return (
                <div 
                  key={photo.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    isSynced 
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative flex items-center justify-center">
                    <img 
                      src={imgSrc} 
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback icon if not yet uploaded to public/
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <ImageIcon className="w-5 h-5 text-slate-400 absolute" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase text-emerald-700">
                        Photo #{idx + 1}
                      </span>
                      {isSynced ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                          Ready for sync
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                      {photo.title}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        {photo.filename}
                      </p>
                      <label className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 px-2 py-0.5 rounded cursor-pointer transition-colors">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await readFileAsDataUrl(file);
                                saveSchoolPhoto(photo.filename, base64);
                                refreshSyncStatus();
                              } catch (err) {
                                console.error('Upload failed', err);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Files stored locally in your browser session & public folder</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
