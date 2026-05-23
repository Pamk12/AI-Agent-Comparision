import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error caught by boundary:", error, errorInfo);
    if (this.props.showToast) {
      this.props.showToast(`UI Crash: ${error.message}`);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-primary)', textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>UI Render Error</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The application encountered an unexpected error while rendering.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{ marginTop: '24px', padding: '12px 24px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}
