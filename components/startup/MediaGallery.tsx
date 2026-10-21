"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

export default function MediaGallery({ videoUrl, images }: { videoUrl?: string | null; images?: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasVideo = !!videoUrl;
  const hasImages = images && images.length > 0;
  
  if (!hasVideo && !hasImages) return null;

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getVimeoVideoId = (url: string) => {
    const regExp = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const ytId = getYoutubeVideoId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    
    const vimId = getVimeoVideoId(url);
    if (vimId) return `https://player.vimeo.com/video/${vimId}`;
    
    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  
  const mediaItems: { type: "video" | "image"; url: string; original?: string }[] = [];
  
  if (embedUrl) {
    mediaItems.push({ type: "video", url: embedUrl, original: videoUrl as string });
  }
  
  if (hasImages) {
    images.forEach((img) => mediaItems.push({ type: "image", url: img }));
  }

  const activeMedia = mediaItems[activeIndex];

  if (!activeMedia) return null;

  return (
    <div className="w-full mb-12">
      {/* Hero Display */}
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-sm border border-gray-100">
        {activeMedia.type === "video" ? (
          <iframe
            src={activeMedia.url}
            title="Video Player"
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <Image src={activeMedia.url} alt={`Startup media ${activeIndex + 1}`} fill sizes="(min-width: 1024px) 992px, calc(100vw - 32px)" className="object-cover" />
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-[border-color,box-shadow,opacity] ${
                activeIndex === idx
                  ? "border-coral-500 opacity-100 ring-2 ring-coral-500 ring-offset-1"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" fill="white" />
                </div>
              ) : (
                <Image src={item.url} alt={`Startup media thumbnail ${idx + 1}`} fill sizes="128px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
