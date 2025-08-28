"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  slug: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://cryptonex.us/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading courses…</p>;
  if (!courses.length) return <p>No courses yet.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      <ul className="space-y-2">
        {courses.map((c) => (
          <li key={c.id} className="border p-2 rounded">
            <strong>{c.title}</strong> <span className="text-gray-500">({c.slug})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
