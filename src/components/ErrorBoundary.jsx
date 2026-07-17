import { Component } from 'react';

// A render error anywhere in the tree would otherwise leave readers a blank
// iframe. Show the board's own error treatment instead.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Board crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="board">
          <main>
            <div className="board-error" role="alert">
              <strong>The board hit a snag.</strong> Reload the page to try again.
            </div>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
