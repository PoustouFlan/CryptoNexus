'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';


type Course = { id: string; title: string; slug: string; official: boolean; createdAt: string; author?: { id: string; name?: string | null } };
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch(`${BACKEND_URL}/courses`)
      .then((res) => res.json())
      .then((data) => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);


  if (loading) return <p className="p-6">Loading courses…</p>;
  if (!courses.length) return <p className="p-6">No courses yet.</p>;


  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.id} className="border p-3 rounded">
            <Link href={`/courses/${c.slug}`} className="font-semibold hover:underline">{c.title}</Link>
            <div className="text-sm text-gray-500">
              {c.official ? 'Official' : 'Unofficial'} · {new Date(c.createdAt).toLocaleDateString()}
              {c.author?.name ? ` · by ${c.author.name}` : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}