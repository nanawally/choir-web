import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">melisma</h1>
      <div className="flex flex-col mt-8 md:flex-row gap-4">
        <Link
          href="/concerts"
          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
        >
          <h2 className="text-lg font-semibold">Concerts</h2>
          <p className="text-sm text-gray-500">
            Manage concerts and formations
          </p>
        </Link>
        <Link
          href="/songs"
          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
        >
          <h2 className="text-lg font-semibold">Songs</h2>
          <p className="text-sm text-gray-500">
            Manage your song library
          </p>
        </Link>
        <Link
          href="/roster"
          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
        >
          <h2 className="text-lg font-semibold">Roster</h2>
          <p className="text-sm text-gray-500">
            Manage your roster and member information
          </p>
        </Link>
      </div>
    </main>
  );
}
