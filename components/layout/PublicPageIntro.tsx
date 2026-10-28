import type { ReactNode } from "react";

export default function PublicPageIntro({ title, description, children }: {
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-gray-100 bg-white py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h1 className="page-title">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p>
        {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
