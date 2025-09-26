'use client'
import React, { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
// import './prism-overrides.css'

type ParamsType = { slug: string } | Promise<{ slug: string }>

const PRISM_MODULE_MAP: Record<string, string> = {
  python: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'jsx',
  typescript: 'typescript',
  ts: 'typescript',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  go: 'go',
  ruby: 'ruby',
  rb: 'ruby',
  php: 'php',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  json: 'json',
  xml: 'markup',
  html: 'markup',
  svg: 'markup',
  markdown: 'markdown',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  sql: 'sql',
  swift: 'swift',
  kotlin: 'kotlin',
  rust: 'rust',
  cppmodern: 'cpp'
}

async function ensurePrismLanguage(langRaw?: string | null) {
  if (!langRaw) return
  const lang = (langRaw || '').toLowerCase()
  const moduleName = PRISM_MODULE_MAP[lang] || lang
  // If already loaded, nothing to do
  if ((Prism.languages as any)[moduleName] || (Prism.languages as any)[lang]) return
  try {
    // dynamic import - may throw if module doesn't exist
    await import(/* webpackIgnore: false */ `prismjs/components/prism-${moduleName}`)
  } catch (err) {
    // fallback: try raw lang name
    if (moduleName !== lang) {
      try {
        await import(/* webpackIgnore: false */ `prismjs/components/prism-${lang}`)
      } catch {
        // ignore - leave unhighlighted
        return
      }
    }
  }
}

function escapeHtml(unsafe: string) {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#039;'
      default:
        return m
    }
  })
}

export default function ExercisePage({ params }: { params: ParamsType }) {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null)
  const [exercise, setExercise] = useState<any>(null)
  const [code, setCode] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [, bump] = useState(0) // used to force re-render after async language load

  useEffect(() => {
    let mounted = true

    async function resolveParamSlug(p: ParamsType): Promise<string | null> {
      try {
        if (p && typeof (p as any).then === 'function') {
          const resolved = await (p as Promise<{ slug: string }>)
          return resolved?.slug ?? null
        } else if (p && typeof p === 'object') {
          return (p as { slug?: string }).slug ?? null
        }
      } catch {}
      return null
    }

    ;(async () => {
      const slug = await resolveParamSlug(params)
      if (!mounted) return
      if (!slug) {
        setResolvedSlug(null)
        return
      }
      setResolvedSlug(slug)

      try {
        const urlBase = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const res = await fetch(`${urlBase}/exercises/${slug}`)
        if (!res.ok) {
          setExercise(null)
          return
        }
        const j = await res.json()
        if (!mounted) return
        setExercise(j)
        setCode(j.codeStub || '# write your solution here\n')

        // proactively load the editor language and common fallbacks used in course statements
        const editorLang = j.language || 'python'
        await ensurePrismLanguage(editorLang)
        // also ensure 'markup' for HTML/MD code blocks & common languages
        await ensurePrismLanguage('markup')
        await ensurePrismLanguage('python')
        bump((v) => v + 1)
      } catch (err) {
        console.error(err)
        if (mounted) setExercise(null)
      }
    })()

    return () => {
      mounted = false
    }
  }, [params])

  const highlightWithPrism = useCallback(
    (src: string) => {
      const langKey =
        (exercise && typeof exercise.language === 'string' && exercise.language.toLowerCase()) || 'python'
      const moduleName = PRISM_MODULE_MAP[langKey] || langKey
      const prismLang = (Prism.languages as any)[moduleName] || (Prism.languages as any)[langKey] || Prism.languages.python
      try {
        return Prism.highlight(src, prismLang, moduleName)
      } catch {
        return escapeHtml(src)
      }
    },
    [exercise]
  )

  function CodeBlock({ inline, className, children }: any) {
    const languageMatch = /language-(\w+)/.exec(className || '')
    const langFromClass = languageMatch ? languageMatch[1] : null
    const lang = langFromClass || (exercise && exercise.language) || 'text'
    const codeText = String(children).replace(/\n$/, '')

    const moduleName = PRISM_MODULE_MAP[lang] || lang
    const loaded = !!((Prism.languages as any)[moduleName] || (Prism.languages as any)[lang])

    if (inline) {
      return <code className={`inline-code language-${lang}`}>{children}</code>
    }

    if (!loaded) {
      // fire-and-forget load, then re-render when done
      ensurePrismLanguage(lang).then(() => bump((v) => v + 1)).catch(() => null)
      return (
        <pre className={`language-${lang} rounded-lg p-4 overflow-auto`} style={{ background: 'transparent' }}>
          <code>{codeText}</code>
        </pre>
      )
    }

    try {
      const prismLang = (Prism.languages as any)[moduleName] || (Prism.languages as any)[lang] || Prism.languages.markup
      const html = Prism.highlight(codeText, prismLang, moduleName)
      return (
        <pre className={`language-${lang} rounded-lg p-4 overflow-auto`} style={{ background: 'transparent' }}>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )
    } catch {
      return (
        <pre className={`language-${lang} rounded-lg p-4 overflow-auto`} style={{ background: 'transparent' }}>
          <code>{codeText}</code>
        </pre>
      )
    }
  }

  async function run() {
    if (!resolvedSlug) return
    setRunning(true)
    setResult(null)
    try {
      const urlBase = process.env.NEXT_PUBLIC_BACKEND_URL || ''
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (token) headers['Authorization'] = 'Bearer ' + token
      const res = await fetch(`${urlBase}/exercises/${resolvedSlug}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      })
      const j = await res.json()
      setResult(j)
    } catch (err: any) {
      setResult({ status: 'ERR', error: err?.message || String(err) })
    } finally {
      setRunning(false)
    }
  }

  if (!resolvedSlug || !exercise) {
    return <div className="max-w-4xl mx-auto p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold">{exercise.title}</h1>

      <div className="mt-4 prose dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code: CodeBlock,
          }}
        >
          {exercise.statement || ''}
        </ReactMarkdown>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Code editor ({exercise.language || 'python'})</div>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <Editor
            value={code}
            onValueChange={(v) => setCode(v)}
            highlight={(c) => highlightWithPrism(c)}
            padding={12}
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 14,
              minHeight: 220,
              outline: 0,
              background: 'transparent',
              color: 'inherit',
            }}
            textareaId="exercise-editor"
            aria-label="Code editor"
          />
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center px-4 py-2 rounded-md font-semibold bg-yellow-400 text-black disabled:opacity-60"
          >
            {running ? 'Running...' : 'Run tests'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg">Results</h3>
          <div>
            <div className="font-mono text-sm">Status: {result.status || 'UNKNOWN'}</div>
            <ol className="mt-2 list-decimal pl-6">
              {(result.results || []).map((r: any, idx: number) => {
                const ok =
                  r.ok ??
                  (r.stdout?.trim &&
                    exercise.tests &&
                    exercise.tests[idx] &&
                    r.stdout.trim() === (exercise.tests[idx].expected || '').trim())
                return (
                  <li key={idx} className={ok ? 'text-green-400' : 'text-red-400'}>
                    Test {r.idx ?? idx}: {ok ? 'pass' : 'fail'}
                    <div className="text-xs mt-1">
                      <div>stdout:</div>
                      <pre className="bg-slate-800 p-2 rounded text-xs overflow-x-auto">{r.stdout}</pre>
                      {r.stderr && (
                        <>
                          <div className="mt-1">stderr:</div>
                          <pre className="bg-slate-800 p-2 rounded text-xs overflow-x-auto">{r.stderr}</pre>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
              {Array.isArray(result.results) && result.results.length === 0 && (
                <li className="text-yellow-300">No test output.</li>
              )}
            </ol>
            {result.error && (
              <div className="mt-3 text-sm text-red-400">
                Error: <pre className="bg-slate-800 p-2 rounded text-xs">{String(result.error)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
