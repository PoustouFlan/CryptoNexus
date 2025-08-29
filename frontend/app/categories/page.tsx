'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-yellow-400 rounded-xl p-6 shadow-lg hover:scale-105 transition"
          >
            {c.icon && <span className="text-4xl mb-2">{c.icon}</span>}
            <span className="font-bold">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
