'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Submission {
  id: string;
  status: string;
  resultJson: string;
  createdAt: string;
  isOfficial?: boolean;
}

export default function ExerciseSubmissionsPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
  
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!slug) return;
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Not authenticated');
        return;
      }
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/exercises/${slug}/submissions`, {
          headers: {
          'Authorization': `Bearer ${token}`
          }
      }).then(res => res.json()).then(data => { console.log(data); setSubmissions(data); setLoading(false); }); 
    }, [slug]);

  const markOfficial = async (submissionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/exercises/${slug}/submissions/${submissionId}/official`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
    });
    setSubmissions(subs => subs.map(s => ({ ...s, isOfficial: s.id === submissionId })));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Submissions</h1>
      <ul className="space-y-4">
        {submissions.map(sub => (
          <li key={sub.id} className="p-4 border rounded bg-gray-900">
            <div className="flex justify-between items-center">
              <span>{new Date(sub.createdAt).toLocaleString()}</span>
              <span className={`px-2 py-1 rounded ${sub.status === 'OK' ? 'bg-green-600' : 'bg-red-600'}`}>{sub.status}</span>
            </div>
            <pre className="mt-2 p-2 bg-gray-800 rounded text-sm overflow-x-auto">
              {JSON.stringify(sub, null, 2)}
            </pre>
            {!sub.isOfficial && (
              <button onClick={() => markOfficial(sub.id)} className="mt-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded">
                Mark as official
              </button>
            )}
            {sub.isOfficial && <span className="mt-2 text-yellow-400 font-semibold block">Official solution</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
