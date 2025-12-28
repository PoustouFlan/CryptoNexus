'use client';

import React, { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import TikzRenderer from '@/components/TikzRenderer';
import rehypeRaw from 'rehype-raw';
import { compileTikzToSvg } from '@/utils/TikzCompiler';
import InteractiveRunner from './InteractiveRunner';

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

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex, rehypeHighlight, rehypeRaw];

// Memoized Preview Component
const CoursePreview = memo(function CoursePreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none p-6 rounded-lg bg-slate-900 border border-slate-800 overflow-y-auto h-[calc(100vh-200px)]">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (!inline && lang === 'tikz') {
              return <TikzRenderer code={String(children).replace(/\n$/, '')} />;
            }
            if (!inline && (lang === 'jsx' || lang === 'react')) {
              return <InteractiveRunner code={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default function CourseForm({ initialData, slug, onSuccess }: CourseFormProps) {
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [debouncedContent, setDebouncedContent] = useState(initialData?.content || '');

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

  useEffect(() => {
    if (initialData?.content) {
      let editableContent = initialData.content;
      
      const bakedRegex = /<div class="[^"]+" data-original-source="([^"]+)">[\s\S]*?<\/div>/g;
      
      editableContent = editableContent.replace(bakedRegex, (match, encodedSource) => {
        const source = decodeURIComponent(encodedSource);
        return "```tikz\n" + source.trim() + "\n```";
      });

      setContent(editableContent);
      setDebouncedContent(editableContent);
      setTitle(initialData.title);
    }
  }, [initialData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(content);
    }, 500);
    return () => clearTimeout(handler);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setBusy(false); return; }

    let finalContent = content;
    
    const tikzRegex = /```tikz\s*([\s\S]*?)\s*```/g;
    const matches = [...content.matchAll(tikzRegex)];

    for (const match of matches) {
      const fullMatch = match[0];
      const tikzCode = match[1];

      try {
        const svg = await compileTikzToSvg(tikzCode);
        const bakedHtml = `<div class="tikz-diagram-container my-6 flex justify-center bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm overflow-x-auto" data-original-source="${encodeURIComponent(tikzCode)}">
${svg}
</div>`;
        
        finalContent = finalContent.replace(fullMatch, bakedHtml);
      } catch (err) {
        console.error("Failed to compile a diagram", err);
      }
    }

    const method = slug ? 'PUT' : 'POST';
    const url = slug ? `${BACKEND_URL}/courses/${slug}` : `${BACKEND_URL}/courses`;
    const body = { title, content: finalContent, categoryId: selectedCategory };

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
    <form onSubmit={handleSubmit} className="space-y-6 p-6 w-full">
      <div className="max-w-4xl mx-auto w-full">
        <label className="block text-sm font-medium mb-2 text-slate-300">Title</label>
        <input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-2 text-slate-300">Content</label>
          <br/>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            className="w-full h-[calc(100vh-200px)] p-4 font-mono text-sm bg-slate-900 text-slate-100 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none leading-relaxed"
            placeholder="# RSA basics..."
          />
          <p className="text-xs text-slate-400 mt-2">Supports GFM, LaTeX, TikZ, and syntax-highlighted code.</p>
        </div>
        
        <div className="flex flex-col">
           <label className="block text-sm font-medium mb-2 text-slate-300">Preview</label>
           <CoursePreview content={debouncedContent} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Category</label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)} 
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">No category</option>
            {allCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-slate-300">Select exercises:</h4>
          <div className="grid grid-cols-2 gap-2 bg-slate-800 p-4 rounded-lg border border-slate-700">
            {allExercises.map(ex => (
              <label key={ex.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700 p-1 rounded">
                <input
                  type="checkbox"
                  className="rounded text-yellow-400 focus:ring-yellow-400 bg-slate-900 border-slate-600"
                  checked={selectedExercises.includes(ex.id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedExercises([...selectedExercises, ex.id]);
                    else setSelectedExercises(selectedExercises.filter(id => id !== ex.id));
                  }}
                /> 
                <span className="text-sm text-slate-200">{ex.title}</span>
              </label>
            ))}
          </div>
        </div>

        <button disabled={busy} type="submit" className="bg-yellow-400 text-slate-900 font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 w-full lg:w-auto">
          {busy ? (slug ? 'Saving…' : 'Creating…') : (slug ? 'Save' : 'Create course')}
        </button>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>
    </form>
  );
}