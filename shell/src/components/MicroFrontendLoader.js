import React, { useState, useEffect, useRef } from 'react';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';

const MicroFrontendLoader = ({ url, scope, module }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadMicroFrontend = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if the script is already loaded
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (!existingScript) {
          // Create and load the script
          const script = document.createElement('script');
          script.src = url;
          script.type = 'text/javascript';
          script.async = true;

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
          });
        }

        // Wait a bit for the module to be available
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get the container from the global scope
        const container = window[scope];
        if (!container) {
          throw new Error(`Container ${scope} not found`);
        }

        // Create a separate div for the micro-frontend
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const microFrontendDiv = document.createElement('div');
          microFrontendDiv.id = `micro-frontend-${scope}-${Date.now()}`;
          microFrontendDiv.style.width = '100%';
          microFrontendDiv.style.minHeight = '400px';
          containerRef.current.appendChild(microFrontendDiv);

          try {
            // Get the factory function
            const factory = await container.get(module);
            const Module = factory();
            
            // Try to get React and ReactDOM from the remote
            let MicroReact, MicroReactDOM;
            try {
              const reactFactory = await container.get('react');
              const reactDOMFactory = await container.get('react-dom');
              MicroReact = reactFactory();
              MicroReactDOM = reactDOMFactory();
            } catch (reactError) {
              // Fallback: use window React/ReactDOM if available
              MicroReact = window.React;
              MicroReactDOM = window.ReactDOM;
              
              if (!MicroReact || !MicroReactDOM) {
                throw new Error('React/ReactDOM not available in micro-frontend or window');
              }
            }

            let ComponentToRender;
            if (Module.default) {
              ComponentToRender = Module.default;
            } else if (typeof Module === 'function') {
              ComponentToRender = Module;
            } else {
              throw new Error('Invalid module format - no default export or function found');
            }

            // Render using the micro-frontend's React instance
            if (MicroReactDOM.createRoot) {
              const root = MicroReactDOM.createRoot(microFrontendDiv);
              root.render(MicroReact.createElement(ComponentToRender));
            } else if (MicroReactDOM.render) {
              // Fallback for older React versions
              MicroReactDOM.render(MicroReact.createElement(ComponentToRender), microFrontendDiv);
            } else {
              throw new Error('Neither createRoot nor render method available in ReactDOM');
            }
          } catch (moduleError) {
            console.error('Module loading error:', moduleError);
            throw new Error(`Failed to load module: ${moduleError.message}`);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading micro-frontend:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMicroFrontend();
  }, [url, scope, module]);

  if (loading) {
    return (
      <Box 
        className="micro-frontend-container"
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading micro-frontend...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="micro-frontend-container" p={2}>
        <Alert severity="error">
          <Typography variant="h6">Micro-frontend Load Error</Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This usually happens when the micro-frontend is not running. 
            Please ensure the support-tickets-app is running on port 3002.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef} 
      className="micro-frontend-container"
      sx={{ minHeight: '400px', width: '100%' }}
    />
  );
};

export default MicroFrontendLoader;
