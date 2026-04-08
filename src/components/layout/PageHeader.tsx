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
          className="text-silver-mist hover:text-white text-lg"
          aria-label="Back"
        >
          ←
        </button>
      )}
      <h1 className="text-lg font-semibold text-white flex-1 truncate">{title}</h1>
      {action}
    </header>
  );
}
