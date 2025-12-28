'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Link from 'next/link';
import TikzRenderer from '@/components/TikzRenderer';
import rehypeRaw from 'rehype-raw';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type Course = {
  id: string;
  title: string;
  slug: string;
  content: string;
  official: boolean;
  createdAt: string;
  author?: { id: string; name?: string | null; email?: string | null };
  exercises: {id: string; slug: string; title: string}[];
};

export default function CoursePage() {
  const { slug } = useParams() as { slug: string };
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      const res = await fetch(`${BACKEND_URL}/courses/${slug}`, { cache: 'no-store' });
      if (res.ok) setCourse(await res.json());
    }
    fetchCourse();
  }, [slug]);

  if (!course) return <div className="p-6 text-gray-200">Loading course…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto prose prose-invert">
      <h1>{course.title}</h1>
      <div className="text-sm text-gray-400 mb-2">
        {course.official ? 'Official' : 'Unofficial'} · {new Date(course.createdAt).toLocaleString()}
        {course.author?.name ? ` · by ${course.author.name}` : null}
      </div>
      <hr className="my-4 border-gray-700" />
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isTikz = match && match[1] === 'tikz';
            if (!inline && isTikz) {
              return <TikzRenderer code={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {course.content}
      </ReactMarkdown>
      <h2 className="text-xl font-bold mt-10">Exercises</h2>
      <ul>
        {course.exercises.map((ce:any) => (
          <li key={ce.exercise.id}>
            <Link href={`/exercises/${ce.exercise.slug}`}>{ce.exercise.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
