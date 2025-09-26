import './globals.css';
import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { AuthProvider } from './auth/userContext';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-900 to-blue-700 text-gray-200 font-sans">
        <header className="p-4 border-b flex gap-4 items-center">
          <Link href="/">Home</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/courses/new" className="ml-auto">New course</Link>
          <Link href="/exercises/new">New Exercise</Link>
          <Link href="/profile">Profile</Link>
        </header>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
