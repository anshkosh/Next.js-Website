"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ArrowDown, Trash2, Plus, Star, Clock3, Zap } from "lucide-react";
import {
  addFeaturedStartup,
  featureLatestStartupForOneDay,
  removeFeaturedStartup,
  reorderFeaturedStartups,
} from "@/app/actions/featured";

type FeaturedItem = {
  id: string;
  sortOrder: number;
  featuredUntil: Date | string | null;
  startup: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    tagline: string;
  };
};

type LiveStartup = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  createdAt: Date | string;
};

const formatFeatureEnd = (value: Date | string) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
}).format(new Date(value));

export default function FeaturedManager({
  featuredList,
  availableStartups,
  latestLiveStartup,
}: {
  featuredList: FeaturedItem[];
  availableStartups: LiveStartup[];
  latestLiveStartup: LiveStartup | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStartupId, setSelectedStartupId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const featuredStartupIds = new Set(featuredList.map((item) => item.startup.id));
  const dropdownOptions = availableStartups.filter((s) => !featuredStartupIds.has(s.id));
  const latestFeatured = latestLiveStartup
    ? featuredList.find((item) => item.startup.id === latestLiveStartup.id)
    : null;

  const handleAdd = () => {
    if (!selectedStartupId) return;
    setMessage(null);
    startTransition(async () => {
      const res = await addFeaturedStartup(selectedStartupId);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Featured startup added successfully!" });
        setSelectedStartupId("");
      }
    });
  };

  const handleRemove = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await removeFeaturedStartup(id);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Featured startup removed." });
      }
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featuredList.length) return;

    const reordered = [...featuredList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const orderedIds = reordered.map((item) => item.id);
    setMessage(null);
    startTransition(async () => {
      const res = await reorderFeaturedStartups(orderedIds);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      }
    });
  };

  const handleFeatureLatest = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await featureLatestStartupForOneDay();
      if ("error" in res) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: `${res.startupName} is featured on Discover for 24 hours.` });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Slot Status */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-gray-900 font-heading">Featured Capacity</span>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-200">
          {featuredList.length} / 6 slots used
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-coral-200 bg-gradient-to-br from-coral-50 via-white to-white p-5 shadow-2xs sm:p-6" aria-labelledby="feature-latest-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-100 text-coral-700">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="feature-latest-title" className="font-heading text-base font-bold text-gray-900">Feature the newest startup for 24 hours</h2>
              {latestLiveStartup ? (
                <p className="mt-1 text-sm text-gray-600">
                  Newest live listing: <span className="font-semibold text-gray-900">{latestLiveStartup.name}</span>
                  {latestFeatured?.featuredUntil && (
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-amber-800">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      Current one-day feature ends {formatFeatureEnd(latestFeatured.featuredUntil)} IST.
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-600">A live startup will appear here when one is published.</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleFeatureLatest}
            disabled={!latestLiveStartup || isPending || (featuredList.length >= 6 && !latestFeatured)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-coral-600 px-5 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Updating feature…" : latestFeatured ? "Restart 24-hour feature" : "Feature for 24 hours"}
          </button>
        </div>
        {featuredList.length >= 6 && !latestFeatured && (
          <p className="mt-4 border-t border-coral-200 pt-3 text-xs text-gray-600">All six slots are in use. Remove a featured startup to make room for the newest listing.</p>
        )}
      </section>

      {/* Featured List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900 text-sm font-heading">
          Ordered Featured List
        </div>

        {featuredList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No featured startups set. Select a startup below to feature.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {featuredList.map((item, index) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="w-8 h-8 relative rounded-md border border-gray-200 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">
                    {item.startup.logoUrl ? (
                      <Image
                        src={item.startup.logoUrl}
                        alt={item.startup.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      item.startup.name.charAt(0)
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.startup.name}</h4>
                    <p className="text-xs text-gray-500 truncate max-w-xs sm:max-w-md">
                      {item.startup.tagline}
                    </p>
                    {item.featuredUntil && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        Temporary · ends {formatFeatureEnd(item.featuredUntil)} IST
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0 || isPending}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === featuredList.length - 1 || isPending}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition-colors text-xs"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Featured Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base font-heading">
          Add Featured Startup
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedStartupId}
            onChange={(e) => setSelectedStartupId(e.target.value)}
            disabled={featuredList.length >= 6 || isPending}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20"
          >
            <option value="">Select a LIVE startup...</option>
            {dropdownOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            disabled={!selectedStartupId || featuredList.length >= 6 || isPending}
            className="px-5 py-2 bg-coral-600 hover:bg-coral-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
