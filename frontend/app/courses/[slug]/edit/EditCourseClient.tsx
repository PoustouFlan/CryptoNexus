'use client';
import CourseForm from '@/components/CourseForm';
import { useEffect, useState } from 'react';

interface ExerciseLink {
  exercise: { id: string; title: string };
}

interface Category {
  id: string;
  name: string;
}

interface CourseData {
  title: string;
  content: string;
  category?: Category;
  exercises: ExerciseLink[];
}

export default function EditCourseClient({ params }: { params: { slug: string } }) {
  const [courseData, setCourseData] = useState<CourseData | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/courses/${params.slug}`).then(res => res.json()).then(setCourseData);
  }, [params.slug]);

  if (!courseData) return <p>Loading…</p>;

  return <CourseForm
    initialData={{
      title: courseData.title,
      content: courseData.content,
      categoryId: courseData.category?.id,
      exercises: courseData.exercises.map(e => e.exercise.id),
    }}
    slug={params.slug}
  />;
}
