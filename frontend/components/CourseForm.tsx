'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Exercise {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

interface CourseFormProps {
  initialData?: {
    title: string;
    content: string;
    categoryId?: string;
    exercises?: string[];
  };
  slug?: string;
  onSuccess?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function CourseForm({ initialData, slug, onSuccess }: CourseFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialData?.exercises || []);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialData?.categoryId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/exercises`).then(res => res.json()).then(setAllExercises);
    fetch(`${BACKEND_URL}/categories`).then(res => res.json()).then(setAllCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setBusy(false); return; }

    const method = slug ? 'PUT' : 'POST';
    const url = slug ? `${BACKEND_URL}/courses/${slug}` : `${BACKEND_URL}/courses`;
    const body = { title, content, categoryId: selectedCategory };

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!res.ok) { setError('Failed to save course'); setBusy(false); return; }
    const data = await res.json();

    if (selectedExercises.length > 0) {
      await fetch(`${BACKEND_URL}/course-exercises/${data.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exerciseIds: selectedExercises }),
      });
    }

    if (onSuccess) onSuccess();
    else router.push(`/courses/${data.slug}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-5xl mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="border p-2 rounded w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Content (Markdown + LaTeX + Code)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            className="border p-2 rounded w-full min-h-[500px] font-mono bg-blue-900 text-gray-100"
            placeholder="# RSA basics\n\nWe study $\\mathbb{Z}_n^*$ and Euler's totient $\\varphi(n)$ ..."
          />
          <p className="text-xs text-gray-300 mt-1">Supports GFM, LaTeX, and syntax-highlighted code. Use ```python etc. for code blocks.</p>
        </div>
        <div className="prose prose-invert max-w-none p-4 rounded bg-blue-800 overflow-y-auto min-h-[500px]">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border p-2 rounded w-full">
          <option value="">No category</option>
          {allCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div>
        <h4 className="font-medium mb-1">Select exercises:</h4>
        {allExercises.map(ex => (
          <label key={ex.id} className="block">
            <input
              type="checkbox"
              checked={selectedExercises.includes(ex.id)}
              onChange={e => {
                if (e.target.checked) setSelectedExercises([...selectedExercises, ex.id]);
                else setSelectedExercises(selectedExercises.filter(id => id !== ex.id));
              }}
            /> {ex.title}
          </label>
        ))}
      </div>

      <button disabled={busy} type="submit" className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded">
        {busy ? (slug ? 'Saving…' : 'Creating…') : (slug ? 'Save' : 'Create course')}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </form>
  );
}
