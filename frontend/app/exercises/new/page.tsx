'use client'
import React, { useState } from 'react'
import CourseEditor from '@/components/CourseEditor'


type Exercise = { title: string; statement: string; codeStub: string; allowedLibs: string[]; tests: { input: string; expected: string }[] };

export default function Page(){
  const [draft, setDraft] = useState<Exercise>({ title: '', statement: '', codeStub: '', allowedLibs: [], tests: [{input: '', expected: ''}] });
  const [saving, setSaving] = useState(false);

  function onPatch(p: any){ setDraft(d => ({ ...d, ...p })); }

  async function create(){
    setSaving(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/exercises`, { method: 'POST', headers: { 'content-type': 'application/json' , Authorization: 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify(draft) });
    if (!res.ok) alert('Error creating');
    else { const j = await res.json(); window.location.href = `/exercises/${j.slug}`; }
    setSaving(false);
  }

  return (<div className="max-w-3xl mx-auto p-8">
    <h1 className="text-2xl font-bold">Create Exercise</h1>
    <CourseEditor title={draft.title} statement={draft.statement} codeStub={draft.codeStub} onChange={onPatch} />

    <div className="mt-4">
      <div className="text-sm font-medium">Tests</div>
      {draft.tests.map((t,i)=> (
        <div key={i} className="grid grid-cols-2 gap-2 mt-2">
          <textarea placeholder="input" value={t.input} onChange={e => { const ts = [...draft.tests]; ts[i].input = e.target.value; setDraft(d => ({ ...d, tests: ts })); }} className="p-2 bg-slate-800" />
          <textarea placeholder="expected output" value={t.expected} onChange={e => { const ts = [...draft.tests]; ts[i].expected = e.target.value; setDraft(d => ({ ...d, tests: ts })); }} className="p-2 bg-slate-800" />
        </div>
      ))}
      <label>Allowed libraries (comma separated)</label>
      {draft.allowedLibs.map((t,i)=> (
        <div key={i} className="grid grid-cols-2 gap-2 mt-2">
          <textarea placeholder="pycryptodome" value={t} onChange={e => { var ts = [...draft.allowedLibs]; ts[i] = e.target.value; setDraft(d => ({ ...d, allowedLibs: ts })); }} className="p-2 bg-slate-800" />
        </div>
      ))}
      <div className="mt-2">
        <button onClick={() => setDraft(d => ({ ...d, tests: [...d.tests, { input: '', expected: '' }] }))} className="mr-2">Add test</button>
        <button onClick={() => setDraft(d => ({ ...d, allowedLibs: [...d.allowedLibs, ''] }))} className="mr-2">Add library</button>
        <button onClick={create} disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
      </div>
    </div>

  </div>)
}