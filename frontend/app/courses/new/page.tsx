import CourseForm from '@/components/CourseForm';

interface NewCoursePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function NewCoursePage({ searchParams }: NewCoursePageProps) {
  const categoryId = typeof searchParams.categoryId === 'string' 
    ? searchParams.categoryId 
    : undefined;

  const initialData = categoryId 
    ? { title: '', content: '', categoryId } 
    : undefined;
  
  console.log(initialData);

  return (
    <>
      <h1 className="text-3xl font-bold mb-4 text-center">New Course</h1>
      <CourseForm key={categoryId ?? 'default'} initialData={initialData}/>
    </>
  );
}
