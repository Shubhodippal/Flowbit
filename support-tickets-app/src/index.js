import React from 'react';
import ReactDOM from 'react-dom/client';
import SupportTicketsApp from './SupportTicketsApp';

// For standalone mode
if (process.env.NODE_ENV === 'development') {
  const container = document.getElementById('root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<SupportTicketsApp />);
  }
}
