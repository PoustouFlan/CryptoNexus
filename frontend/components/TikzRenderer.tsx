'use client';

import { useEffect, useRef, useState } from 'react';

export default function TikzRenderer({ code }: { code: string }) {
  const [height, setHeight] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">
        <script src="https://tikzjax.com/v1/tikzjax.js"></script>
        <style>
          /* Center the SVG and remove default margins */
          body { margin: 0; padding: 0.5rem; display: flex; justify-content: center; }
          /* Ensure SVG scales nicely */
          svg { width: 100%; height: auto; display: block; }
        </style>
      </head>
      <body>
        <script type="text/tikz">
          ${code}
        </script>

        <script>
          // TikZJax replaces the script tag with an SVG. 
          // We watch the body for this change to trigger a resize.
          const observer = new MutationObserver(() => {
            const svg = document.querySelector('svg');
            if (svg) {
              const height = document.body.scrollHeight;
              window.parent.postMessage({ type: 'TIKZ_RESIZE', height: height }, '*');
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TIKZ_RESIZE') {
        setHeight(e.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="my-4 bg-white rounded overflow-hidden">
      <iframe
        srcDoc={htmlContent}
        style={{ width: '100%', height: `${height}px`, border: 'none' }}
        title="TikZ Diagram"
        loading="lazy"
      />
    </div>
  );
}