import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("React Error Boundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "2rem",
          color: "#f87171",
          backgroundColor: "#0a0e1a",
          fontFamily: "monospace",
          height: "100vh",
          overflow: "auto",
        }}>
          <h1 style={{ color: "#e5e7eb", marginBottom: "1rem" }}>ARIA crashed</h1>
          <p style={{ color: "#f87171", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            {this.state.error.message}
          </p>
          <pre style={{
            whiteSpace: "pre-wrap",
            fontSize: "0.8rem",
            color: "#9ca3af",
            marginTop: "1rem",
          }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
