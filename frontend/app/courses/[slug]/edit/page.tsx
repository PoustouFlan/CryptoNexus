import EditCourseClient from './EditCourseClient';

export default async function EditCoursePage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <EditCourseClient params={resolvedParams} />;
}
