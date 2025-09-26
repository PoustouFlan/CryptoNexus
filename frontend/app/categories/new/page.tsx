'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateCategoryPage() {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, parentId, icon }),
    });

    if (res.ok) router.push('/categories');
    else {
      const text = await res.text();
      alert(`Error: ${res.status} ${text}`);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {parentId ? 'Create Child Category' : 'Create Category'}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="px-4 py-2 rounded bg-gray-800 text-gray-100 border border-gray-600"
        />
        <input
          type="text"
          placeholder="Icon URL (optional)"
          value={icon}
          onChange={e => setIcon(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800 text-gray-100 border border-gray-600"
        />
        <button type="submit" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300">
          Create
        </button>
      </form>
    </div>
  );
}
