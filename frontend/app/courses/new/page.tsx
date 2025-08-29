'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth/userContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function NewCoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user === null) router.push('/auth/login');
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setBusy(false); return; }

    const res = await fetch(`${BACKEND_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) { setError('Failed to create course'); setBusy(false); return; }

    const created = await res.json();
    router.push(`/courses/${created.slug}`);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">New Course</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="border p-2 rounded w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Content (Markdown + LaTeX + Code)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="border p-2 rounded w-full min-h-[500px] font-mono bg-blue-900 text-gray-100"
              placeholder="# RSA basics\n\nWe study $\\mathbb{Z}_n^*$ and Euler's totient $\\varphi(n)$ ..."
            />
            <p className="text-xs text-gray-300 mt-1">Supports GFM, LaTeX, and syntax-highlighted code. Use ```python etc. for code blocks.</p>
          </div>

          <div className="prose prose-invert max-w-none p-4 rounded bg-blue-800 overflow-y-auto min-h-[500px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        <button disabled={busy} type="submit">{busy ? 'Creating…' : 'Create course'}</button>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </form>
    </div>
  );
}
