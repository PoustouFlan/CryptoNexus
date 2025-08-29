import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  children: Category[];
  courses: { id: string; title: string; slug: string; official: boolean; createdAt: string }[];
};

async function fetchCategory(slug: string): Promise<Category | null> {
  const res = await fetch(`${BACKEND_URL}/categories/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const category = await fetchCategory(slug);

  if (!category) return <div className="p-6">Category not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{category.name}</h1>

      {category.children.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Subcategories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {category.children.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-yellow-400 rounded-xl p-4 shadow hover:scale-105 transition"
              >
                {c.icon && <span className="text-3xl mb-1">{c.icon}</span>}
                {c.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {category.courses.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Courses</h2>
          <ul className="space-y-3">
            {category.courses.map((course) => (
              <li key={course.id} className="border p-3 rounded bg-blue-800 hover:bg-blue-700 transition">
                <Link href={`/courses/${course.slug}`} className="font-medium text-yellow-400 hover:underline">
                  {course.title}
                </Link>
                <span className="text-sm text-gray-300 ml-2">
                  · {course.official ? 'Official' : 'Unofficial'} · {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
