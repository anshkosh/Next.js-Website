import { Metadata } from "next";
import FAQContent from "./FAQContent";

export const metadata: Metadata = {
  title: "FAQ — Anshkosh",
  description:
    "Frequently asked questions about Anshkosh, the public validation platform for Indian startups.",
};

export default function FAQPage() {
  return (
    <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 tracking-tight">
          FAQs
        </h1>
        <p className="text-xl text-gray-500 mt-4 mb-12">
          Clear before clever.
        </p>
        <FAQContent />
      </div>
    </section>
  );
}
