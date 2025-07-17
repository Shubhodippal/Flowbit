import React from 'react';
import SupportTicketsApp from './SupportTicketsApp';

// Wrapper component to ensure React context is properly provided
const SupportTicketsWrapper = () => {
  return React.createElement(SupportTicketsApp);
};

export default SupportTicketsWrapper;
