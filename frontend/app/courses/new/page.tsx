'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth/userContext';


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


        if (!res.ok) {
            setError('Failed to create course');
            setBusy(false);
            return;
        }


        const created = await res.json();
        router.push(`/courses/${created.slug}`);
    }


    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">New course</h1>
            <form onSubmit={submit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Content (Markdown + LaTeX)</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} required className="border p-2 rounded w-full min-h-[300px] font-mono" placeholder={`# RSA basics\n\nWe study $\\mathbb{Z}_n^*$ and Euler's totient $\\varphi(n)$ ...`} />
                    <p className="text-xs text-gray-500">Supports GFM and LaTeX (KaTeX). Use <code>$$</code> for display math.</p>
                </div>
                <button disabled={busy} type="submit" className="bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded">{busy ? 'Creating…' : 'Create course'}</button>
                {error && <p className="text-red-600">{error}</p>}
            </form>
        </div>
    );
}