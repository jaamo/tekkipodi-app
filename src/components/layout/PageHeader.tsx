"use client";

import { useRouter } from "next/navigation";

export default function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-deep-charcoal z-40">
      {back && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-1 border border-slate-gray text-silver-mist hover:border-silver-mist hover:text-white text-sm transition-colors"
          aria-label="Back"
        >
          <span>‹</span>
          <span>Back</span>
        </button>
      )}
      <h1 className="text-lg font-semibold text-white flex-1 truncate">{title}</h1>
      {action}
    </header>
  );
}
