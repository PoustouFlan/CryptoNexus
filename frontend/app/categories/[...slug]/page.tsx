'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
  courses?: { id: string; title: string; slug: string }[];
}

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default function CategoryPage({ params }: Props) {
  const resolvedParams = use(params);
  const slugPath = resolvedParams.slug || [];
  const slugQuery = slugPath.join('/');
  const [data, setData] = useState<Category | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token');
      let uid = null;
      if (token) {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          uid = profile.id;
          setUserId(uid);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categories/${slugQuery}`);
      if (res.ok) {
        const category = await res.json();
        setData(category);
      }
    }
    fetchData();
  }, [slugQuery]);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{data.name}</h1>

      {userId && (
        <div className="flex gap-4 mb-6">
          <Link
            href={`/categories/new?parentId=${data.id}`}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300"
          >
            Create Subcategory
          </Link>
          <Link
            href={`/courses/new?categoryId=${data.id}`}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300"
          >
            Create Course
          </Link>
        </div>
      )}

      {data.children && data.children.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Subcategories</h2>
          <ul className="list-disc pl-6">
            {data.children.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${slugPath.concat(c.slug).join('/')}`} className="text-yellow-400 hover:text-yellow-300">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.courses && data.courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Courses</h2>
          <ul className="list-disc pl-6">
            {data.courses.map((course) => (
              <li key={course.id}>
                <Link href={`/courses/${course.slug}`} className="text-yellow-400 hover:text-yellow-300">
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
