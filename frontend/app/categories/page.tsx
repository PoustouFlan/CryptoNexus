'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      {categories.map(cat => (
        <div key={cat.id} className="mb-6 border-b border-gray-700 pb-4">
          <div className="flex justify-between items-center">
            <Link href={`/categories/${cat.slug}`} className="text-xl font-semibold text-yellow-400">
              {cat.name}
            </Link>
            <Link
              href={`/categories/create?parentId=${cat.id}`}
              className="text-sm bg-yellow-400 text-gray-900 px-3 py-1 rounded hover:bg-yellow-300"
            >
              New Child
            </Link>
          </div>
          {cat.children && cat.children.length > 0 && (
            <ul className="mt-2 ml-4 list-disc">
              {cat.children.map(child => (
                <li key={child.id}>
                  <Link href={`/categories/${child.slug}`} className="text-yellow-300 hover:text-yellow-200">
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <Link
        href="/categories/new"
        className="inline-block mt-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300"
      >
        Create Top-Level Category
      </Link>
    </div>
  );
}
