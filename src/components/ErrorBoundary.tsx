import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] dark:bg-[#0A0D14] p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something interrupted the studio</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Reload KromaFolio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
