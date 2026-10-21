import Link from "next/link";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import { calculateReadingTime } from "@/lib/journal-reading-time.mjs";

interface JournalCardProps {
  post: {
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    authorName: string;
    contentHtml: string | null;
    isFeatured: boolean;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
    category?: { name: string; slug: string } | null;
    tags: string[];
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function JournalCard({ post }: JournalCardProps) {
  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-[translate,box-shadow] duration-(--duration-quick)"
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-gradient-to-br from-coral-50 to-gray-100 overflow-hidden">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-(--duration-slow)"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold font-heading text-gray-200 select-none">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        {/* Category badge */}
        {post.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {post.category.name}
            </span>
          </div>
        )}
        {/* Featured badge */}
        {post.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Star size={11} className="fill-amber-900" /> Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h2 className="font-bold font-heading text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-coral-600 transition-colors">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100 mt-auto">
          <span className="font-medium text-gray-500">{post.authorName}</span>
          <div className="flex items-center gap-3">
            {post.updatedAt ? <span>Updated {formatDate(post.updatedAt)}</span> : post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span className="flex items-center gap-1">
              <Clock size={12} /> {calculateReadingTime(post.contentHtml)}m read
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
