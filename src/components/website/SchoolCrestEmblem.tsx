/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, Shield, Sparkles, BookOpen, Award } from 'lucide-react';

interface SchoolCrestEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emerald' | 'gold' | 'light';
}

export default function SchoolCrestEmblem({ 
  className = '', 
  size = 'md',
  variant = 'emerald'
}: SchoolCrestEmblemProps) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-32 h-32 sm:w-36 sm:h-36'
  };

  const iconSizeMap = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  };

  return (
    <div 
      className={`relative rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-900 border-2 border-emerald-400/80 shadow-lg flex items-center justify-center flex-shrink-0 select-none overflow-hidden ${sizeMap[size]} ${className}`}
      aria-label="Givers World Mission Crest Emblem"
    >
      {/* Background geometric emblem patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-400/20 rounded-full blur-sm pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-500/20 rounded-full blur-sm pointer-events-none" />

      {/* Center Shield & Cap Crest */}
      <div className="relative z-10 flex flex-col items-center justify-center text-amber-300">
        <GraduationCap className={`${iconSizeMap[size]} drop-shadow-md text-amber-300`} strokeWidth={2.2} />
        {size !== 'sm' && (
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-emerald-100 uppercase mt-0.5 font-mono drop-shadow-xs">
            GWM
          </span>
        )}
      </div>

      {/* Decorative Star pip */}
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse pointer-events-none" />
    </div>
  );
}
