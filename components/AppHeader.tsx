import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="mb-5 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold text-bunny-700">
        Bunny Training 🐰
      </Link>
      <Link href="/history" className="btn-soft">
        History
      </Link>
    </header>
  );
}
