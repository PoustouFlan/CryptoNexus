// utils/tikzCompiler.ts

async function getHash(text: string) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function compileTikzToSvg(tikzCode: string): Promise<string> {
  const hash = await getHash(tikzCode);
  
  // 1. CACHE BUSTING: We use 'v2' to ignore the old, broken SVGs in your storage.
  const cacheKey = `tikz_v2_${hash}`; 
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Timeout safety
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      reject(new Error('TikZ compilation timed out'));
    }, 10000);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TIKZ_COMPILATION_SUCCESS' && e.data?.sourceHash === hash) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
        
        let rawSvg = e.data.svg as string;
        
        // --- FIX: REGEX CLEANING ---
        // We strip the style attribute specifically from the opening <svg> tag.
        // Regex explanation:
        // (<svg[^>]*)  -> Match the start of the svg tag and any attributes before the style
        // \sstyle="[^"]*" -> Match the specific style attribute (and its value)
        // -> Replace with $1 (keep the first part, drop the style)
        rawSvg = rawSvg.replace(/(<svg[^>]*)\sstyle="[^"]*"/, '$1');
        
        // --- OPTIONAL: CENTERING ---
        // Inject a clean style to ensure the SVG behaves like a block element
        // We append it right before the closing '>' of the opening tag.
        rawSvg = rawSvg.replace(/(<svg[^>]*)>/, '$1 style="display: block; margin: 1rem auto; overflow: visible;">');

        // Save the clean version
        localStorage.setItem(cacheKey, rawSvg);
        resolve(rawSvg);
      }
    };

    window.addEventListener('message', handleMessage);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">
        <script src="https://tikzjax.com/v1/tikzjax.js"></script>
      </head>
      <body>
        <script type="text/tikz">
          ${tikzCode}
        </script>
        <script>
          const observer = new MutationObserver(() => {
            const svg = document.querySelector('svg');
            if (svg) {
              // Send the raw (dirty) SVG to parent. We clean it there.
              window.parent.postMessage({ 
                type: 'TIKZ_COMPILATION_SUCCESS', 
                svg: svg.outerHTML,
                sourceHash: '${hash}'
              }, '*');
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        </script>
      </body>
      </html>
    `;
    
    iframe.srcdoc = html;
  });
}