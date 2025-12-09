'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to auto-navigation page after 2 seconds
    const timer = setTimeout(() => {
      router.push('/auto');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col justify-center gap-6 px-6 py-20">
      <p className="text-base font-semibold uppercase tracking-widest text-blue-500">
        LabSync AI
      </p>
      <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
        Smart Client Intake via Telegram
      </h1>
      <p className="text-lg text-slate-600 sm:max-w-2xl">
        Seamlessly capture client project requests sent through Telegram and
        display them on dashboard for your internal teams to process and
        allocate resources.
      </p>
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-blue-900 font-medium">
          🔄 Auto-navigating to latest status in 2 seconds...
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Or click a link below to navigate manually
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/auto"
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          Start Auto Navigation
        </Link>
        <Link
          href="/messages"
          className="rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:bg-slate-300"
        >
          Messages
        </Link>
      </div>
    </main>
  );
}

