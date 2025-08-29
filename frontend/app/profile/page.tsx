'use client';
import { useAuth } from '../auth/userContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


type MyCourse = { id: string; title: string; slug: string; createdAt: string; official: boolean };


export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mine, setMine] = useState<MyCourse[]>([]);


  useEffect(() => {
    if (user === null) router.push('/auth/login');
  }, [user, router]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${BACKEND_URL}/users/me/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMine(data))
      .catch(() => setMine([]));
  }, [user]);


  if (!user) return <p className="p-6">Loading profile…</p>;


  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="border p-4 rounded space-y-2 mb-8">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.name && <p><strong>Name:</strong> {user.name}</p>}
      </div>


      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">My courses</h2>
          <Link href="/courses/new" className="text-sm underline">Create a new course</Link>
        </div>
        {mine.length === 0 ? (
          <p className="text-gray-600">You haven't created any courses yet.</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((c) => (
              <li key={c.id} className="border p-3 rounded">
                <Link href={`/courses/${c.slug}`} className="font-medium hover:underline">{c.title}</Link>
                <span className="text-sm text-gray-500"> · {new Date(c.createdAt).toLocaleDateString()} · {c.official ? 'Official' : 'Unofficial'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}