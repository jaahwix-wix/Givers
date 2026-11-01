/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('sma_view_mode');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReturnToWebsite = () => {
    try {
      localStorage.setItem('sma_active_role', 'admin');
      localStorage.setItem('sma_view_mode', 'website');
      sessionStorage.removeItem('sma_session_locked');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleClearCacheAndRestart = () => {
    try {
      localStorage.removeItem('sma_students');
      localStorage.removeItem('sma_academic_records');
      localStorage.removeItem('sma_fee_ledgers');
      localStorage.removeItem('sma_teachers');
      localStorage.removeItem('sma_view_mode');
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                {this.props.fallbackTitle || 'Workspace View Refreshed'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The management workspace encountered a render pause. You can quickly refresh the view or return to the main dashboard.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReturnToWebsite}
                  className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Return Home</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleClearCacheAndRestart}
                className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
