"use client";

import Image from "next/image";
import { useState } from "react";

export default function AccountAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral-100 text-xs font-bold uppercase text-coral-700">
    {image && failed !== image ? <Image unoptimized src={image} alt="" width={28} height={28} onError={() => setFailed(image)} className="h-7 w-7 object-cover" /> : name?.charAt(0) || "U"}
  </span>;
}
