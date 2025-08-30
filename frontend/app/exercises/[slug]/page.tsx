'use client'
import React, { use, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function ExercisePage({params}: {params: Promise<{ slug: string }>}){
  const { slug } = use(params)
  const [exercise, setExercise] = useState<any>(null);
  const [code, setCode] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(()=>{ (async ()=>{ const res = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL||'') + '/exercises/' + slug); if (res.ok) { const j = await res.json(); setExercise(j); setCode(j.codeStub || '# write your solution here\n'); } })(); }, [slug]);

  async function run(){
    setRunning(true);
    const res = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL||'') + '/exercises/' + slug + '/submit', { method: 'POST', headers: { 'content-type':'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ code }) });
    const j = await res.json();
    setResult(j.result || j);
    setRunning(false);
  }

  if (!exercise) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold">{exercise.title}</h1>
      <div className="mt-4 prose dark:prose-invert">
        <ReactMarkdown>{exercise.statement}</ReactMarkdown>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Code editor</div>
        <textarea value={code} onChange={e=>setCode(e.target.value)} rows={14} className="w-full p-2 bg-slate-800 font-mono" />
        <div className="mt-2 flex gap-2">
          <button onClick={run} disabled={running}>{running? 'Running...' : 'Run tests'}</button>
        </div>
      </div>

      {result && (<div className="mt-6">
        <h3 className="text-lg">Results</h3>
        <div>
          <div>Status: {result.status}</div>
          <ol>
            {(result.details?.results || result.results || []).map((r: any) => (
              <li key={r.idx} className={r.ok? 'text-green-400' : 'text-red-400'}>
                Test {r.idx}: {r.ok ? 'pass' : 'fail'}
                <div className="text-xs">stdout: <pre className="bg-slate-800 p-2">{r.stdout}</pre></div>
                {r.stderr && <div className="text-xs">stderr: <pre className="bg-slate-800 p-2">{r.stderr}</pre></div>}
              </li>))
            }
          </ol>
        </div>
      </div>)}
    </div>
  )
}