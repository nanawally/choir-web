"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "./lib/api";
import NavSidebar from "./components/NavSidebar";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-24">
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
            href="/chorists"
            className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">Chorists</h2>
            <p className="text-sm text-gray-500">
              Manage choir members and voice assignments
            </p>
          </Link>
          <Link
            href="/voice-groups"
            className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">Voice Groups</h2>
            <p className="text-sm text-gray-500">
              Manage voice groups and parts
            </p>
          </Link>
          <Link
            href="/base-formations"
            className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">Base Formations</h2>
            <p className="text-sm text-gray-500">
              Template formations for new concerts
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
