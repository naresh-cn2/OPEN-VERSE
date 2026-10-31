import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Trash2, Sparkles } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in OPEN-VERSE Mobile:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-[#09090b] text-zinc-100 p-6 select-none">
          <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
            <Sparkles className="size-8 text-violet-400" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white text-center">
            OPEN-VERSE Startup Diagnostic
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 text-center max-w-xs leading-relaxed">
            The application encountered a runtime issue during initialization.
          </p>

          <div className="mt-5 w-full max-w-sm rounded-xl border border-red-500/30 bg-red-950/20 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-300 mb-1">
              <AlertCircle className="size-4 text-red-400 shrink-0" />
              <span>Runtime Exception</span>
            </div>
            <p className="font-mono text-[11px] text-red-200/90 whitespace-pre-wrap break-words leading-relaxed max-h-36 overflow-y-auto">
              {this.state.error?.message || "Unknown rendering exception"}
            </p>
            {this.state.error?.stack && (
              <details className="mt-2 text-[10px] text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-300">View Stack Trace</summary>
                <pre className="mt-1 font-mono text-[9px] text-zinc-400 whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
            <button
              onClick={this.handleReload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-violet-950/40 active:scale-95 transition-all"
            >
              <RefreshCw className="size-4" />
              <span>Reload Application</span>
            </button>

            <button
              onClick={this.handleClearStorage}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-surface-card hover:bg-surface-hover px-4 py-2.5 text-xs font-medium text-zinc-300 active:scale-95 transition-all"
            >
              <Trash2 className="size-3.5 text-zinc-400" />
              <span>Reset Local Cache & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
