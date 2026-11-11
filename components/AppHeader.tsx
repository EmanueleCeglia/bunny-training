import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="mb-5 flex items-center justify-between gap-2">
      <Link href="/" className="text-lg font-bold text-bunny-700">
        Bunny Training 🐰
      </Link>
      <nav className="flex gap-2">
        <Link href="/trophies" className="btn-soft" aria-label="Trophies">
          🏆
        </Link>
        <Link href="/history" className="btn-soft">
          History
        </Link>
      </nav>
    </header>
  );
}
