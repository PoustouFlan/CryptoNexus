'use client'
import React from 'react'

type Props = {
  title?: string
  statement?: string
  codeStub?: string
  onChange?: (v: any) => void
}

export default function CourseEditor({ title = '', statement = '', codeStub = '', onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block">
        <div className="text-sm font-medium">Title</div>
        <input defaultValue={title} onChange={e => onChange?.({ title: e.target.value })} className="w-full p-2 rounded bg-slate-800" />
      </label>

      <label>
        <div className="text-sm font-medium">Statement (Markdown)</div>
        <textarea defaultValue={statement} onChange={e => onChange?.({ statement: e.target.value })} rows={10} className="w-full p-2 rounded bg-slate-800 font-mono" />
      </label>

      <label>
        <div className="text-sm font-medium">Code stub (Python)</div>
        <textarea defaultValue={codeStub} onChange={e => onChange?.({ codeStub: e.target.value })} rows={6} className="w-full p-2 rounded bg-slate-800 font-mono" />
      </label>
    </div>
  )
}