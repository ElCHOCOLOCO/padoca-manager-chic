import React from "react";

type ErrorBoundaryState = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || "" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Intencionalmente simples para não alterar layout nem comportamento
    // (Sentry/telemetria ficou fora conforme pedido)
    // console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-sm text-muted-foreground">
          Ocorreu um erro inesperado.
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}