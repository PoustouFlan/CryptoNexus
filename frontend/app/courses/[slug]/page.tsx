import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


type Course = {
    id: string;
    title: string;
    slug: string;
    content: string;
    official: boolean;
    createdAt: string;
    author?: { id: string; name?: string | null; email?: string | null };
};


async function fetchCourse(slug: string): Promise<Course | null> {
    const res = await fetch(`${BACKEND_URL}/courses/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}


export default async function CoursePage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const course = await fetchCourse(slug);
    if (!course) return <div className="p-6">Course not found.</div>;


    return (
        <div className="p-6 max-w-3xl mx-auto prose">
            <h1>{course.title}</h1>
            <div className="text-sm text-gray-500">
                {course.official ? 'Official' : 'Unofficial'} · {new Date(course.createdAt).toLocaleString()}
                {course.author?.name ? ` · by ${course.author.name}` : null}
            </div>
            <hr className="my-4" />
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {course.content}
            </ReactMarkdown>
        </div>
    );
}