'use client';

import { useEffect, useState, useRef } from 'react';
import ZoomableContainer from './ZoomableContainer';

async function getHash(text: string) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function TikzRenderer({ code }: { code: string }) {
  const [cachedSvg, setCachedSvg] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState(150);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  
  // We use a ref to track the current code's hash without triggering re-renders
  // This helps ensure the event listener always compares against the correct hash
  const activeHash = useRef<string>('');

  useEffect(() => {
    let active = true;
    setIsCheckingCache(true);

    getHash(code).then((hash) => {
      if (!active) return;
      activeHash.current = hash; // Update ref so event listener knows what to look for
      
      const stored = localStorage.getItem(`tikz_v2_${hash}`);
      if (stored) {
        setCachedSvg(stored);
      } else {
        setCachedSvg(null);
      }
      setIsCheckingCache(false);
    });

    return () => { active = false; };
  }, [code]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      // 1. Filter: Ignore messages that aren't about TikZ
      if (!e.data?.type?.startsWith('TIKZ_')) return;

      // 2. Filter: Ignore messages that don't match OUR current code hash
      // This prevents "Diagram B" from accepting "Diagram A's" result.
      if (e.data.sourceHash !== activeHash.current) return;

      if (e.data.type === 'TIKZ_COMPILATION_SUCCESS') {
        let { svg } = e.data;
        const hash = activeHash.current;

        // Cleaning Logic
        svg = svg.replace(/(<svg[^>]*)\sstyle="[^"]*"/, '$1');
        svg = svg.replace(/(<svg[^>]*)>/, '$1 style="display: block; margin: 1rem auto; overflow: visible;">');

        try {
          localStorage.setItem(`tikz_v2_${hash}`, svg);
        } catch (err) {
          console.warn('TikZ Cache full');
        }
        
        setCachedSvg(svg);
      }
      
      if (e.data.type === 'TIKZ_RESIZE') {
        setIframeHeight(e.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Empty dependency array: logic relies on activeHash.current ref

  // We must calculate the hash before rendering the iframe so we can pass it
  // into the HTML. Since getHash is async, we need a small wait or a derived state.
  // However, for the iframe template, we can just pass the code. 
  // The iframe will calculate the hash? No, simpler: 
  // We pass the hash we calculated in the first useEffect to the iframe via the HTML string.
  
  // Wait until we have the hash to render the compiler
  if (isCheckingCache || !activeHash.current) return <div className="h-24 animate-pulse bg-gray-100 rounded my-4" />;

  if (cachedSvg) {
    return (
      <ZoomableContainer>
        <div 
            className="flex justify-center my-6 overflow-x-auto bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm"
            dangerouslySetInnerHTML={{ __html: cachedSvg }} 
        />
      </ZoomableContainer>
    );
  }

  // Compiler Iframe Content
  // We explicitly embed 'activeHash.current' into the postMessage call inside the iframe
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">
        <script src="https://tikzjax.com/v1/tikzjax.js"></script>
        <style>body { margin: 0; padding: 0.5rem; display: flex; justify-content: center; }</style>
      </head>
      <body>
        <script type="text/tikz">
          ${code}
        </script>
        <script>
          const observer = new MutationObserver(() => {
            const svgEl = document.querySelector('svg');
            if (svgEl) {
              const h = document.body.scrollHeight;
              window.parent.postMessage({ 
                type: 'TIKZ_COMPILATION_SUCCESS', 
                svg: svgEl.outerHTML, 
                height: h,
                sourceHash: '${activeHash.current}' // <--- CRITICAL: Pass hash back
              }, '*');
              
              window.parent.postMessage({ 
                type: 'TIKZ_RESIZE', 
                height: h,
                sourceHash: '${activeHash.current}'
              }, '*');
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        </script>
      </body>
    </html>
  `;

  return (
    <div className="my-6 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden p-4 shadow-sm">
      <div className="text-xs text-center text-gray-400 p-1">Compiling diagram...</div>
      <iframe
        srcDoc={htmlContent}
        style={{ width: '100%', height: `${iframeHeight}px`, border: 'none' }}
        title="TikZ Diagram Compiler"
        loading="lazy"
      />
    </div>
  );
}