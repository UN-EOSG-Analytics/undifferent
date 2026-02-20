import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ShareButton } from "./ShareButton";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Image
          src="/images/UN_Logo_Stacked_Colour_English.svg"
          alt="United Nations"
          width={90}
          height={90}
          priority
          className="shrink-0 select-none"
          draggable={false}
        />

        <Link
          href="/"
          className="text-xl font-bold transition-colors hover:text-un-blue"
        >
          UN Document Comparison
        </Link>
        <svg
          className="h-5 w-5 text-un-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>

        <Suspense>
          <ShareButton />
        </Suspense>
      </div>
    </header>
  );
}
