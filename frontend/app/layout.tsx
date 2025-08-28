import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "./auth/userContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
        <header className="p-4 border-b flex justify-between">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
        </header>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

