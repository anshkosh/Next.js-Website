"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchStartupFounders } from "@/lib/startup-team-client";
import type { wizardFields } from "@/lib/startup-wizard";
import { safeLaunchUrl } from "@/lib/launch-resources";

export default function StartupReview({
  data,
  startupId,
  category,
  version,
  onEdit,
}: {
  data: ReturnType<typeof wizardFields>;
  startupId: string;
  category: string;
  version: number;
  onEdit: (step: number) => void;
}) {
  const [team, setTeam] = useState<
    {
      name: string;
      role: string | null;
      photoUrl: string | null;
      linkedinUrl: string | null;
      twitterUrl: string | null;
    }[]
  >([]);
  const [teamError, setTeamError] = useState(false);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    fetchStartupFounders(startupId, controller.signal)
      .then((result) => {
        if (!alive) return;
        setTeam(result.data || []);
        setTeamError(Boolean(result.error));
      })
      .catch(() => {
        if (alive) setTeamError(true);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [startupId, version]);
  const sections = [
    {
      step: 1,
      title: "Basic information",
      fields: [
        ["Name", data.name],
        ["Tagline", data.tagline],
        ["Category", category],
      ],
    },
    {
      step: 2,
      title: "Details",
      fields: [
        ["Description", data.description],
        ["Website", data.websiteUrl],
        ["City", data.city],
        ["Founded year", data.foundedYear],
        ["X / Twitter", data.twitterUrl],
        ["LinkedIn", data.linkedinUrl],
      ],
    },
    {
      step: 3,
      title: "Core proposition",
      fields: [
        ["Problem", data.problemStatement],
        ["Solution", data.solutionStatement],
        ["Audience", data.targetAudience],
        ["Build stage", data.prototypeStatus],
        ["Evidence", data.tractionEvidence],
      ],
    },
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-gray-600">
        Check your complete profile before sending it for review. Submission
        does not publish it immediately.
      </p>
      {sections.map((section) => (
        <section key={section.step} className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">{section.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(section.step)}
              className="min-h-11 font-semibold text-coral-700 underline underline-offset-4"
              aria-label={`Edit ${section.title.toLowerCase()}`}
            >
              Edit
            </button>
          </div>
          <dl className="space-y-3">
            {section.fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-gray-600">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                  {value || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
          {section.step === 2 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600">Logo</p>
              {data.logoUrl ? (
                <Image
                  src={data.logoUrl}
                  alt={`${data.name} logo`}
                  width={80}
                  height={80}
                  unoptimized
                  className="mt-2 rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-gray-600">Not provided</p>
              )}
            </div>
          )}
        </section>
      ))}
      <section className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Founders &amp; team</h3>
          <button
            type="button"
            onClick={() => onEdit(4)}
            className="min-h-11 font-semibold text-coral-700 underline underline-offset-4"
            aria-label="Edit founders and team"
          >
            Edit
          </button>
        </div>
        {teamError ? (
          <p role="alert" className="text-sm text-red-700">
            Could not load the team. Return to Founders &amp; team to check it.
          </p>
        ) : team.length ? (
          <ul className="space-y-3">
            {team.map((founder, index) => (
              <li key={index} className="text-sm text-gray-900">
                <p className="font-medium">
                  {founder.name}
                  {founder.role ? ` — ${founder.role}` : ""}
                </p>
                {founder.photoUrl && (
                  <Image
                    src={founder.photoUrl}
                    alt={founder.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="my-2 rounded-lg"
                  />
                )}
                <p className="break-words text-gray-600">
                  {[founder.linkedinUrl, founder.twitterUrl]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No additional team members.</p>
        )}
      </section>
      <section className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Media &amp; features</h3>
          <button
            type="button"
            onClick={() => onEdit(5)}
            className="min-h-11 font-semibold text-coral-700 underline underline-offset-4"
            aria-label="Edit media and features"
          >
            Edit
          </button>
        </div>
        <p className="break-words text-sm text-gray-700">
          Video: {data.videoUrl || "Not provided"}
        </p>
        <p className="mt-2 text-sm text-gray-700">
          Pitch deck:{" "}
          {safeLaunchUrl(data.pitchDeckUrl) ? (
            <a
              href={safeLaunchUrl(data.pitchDeckUrl)}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View PDF ({data.pitchDeckVisibility})
            </a>
          ) : (
            "Not provided"
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {data.galleryImages.map((url, index) => (
            <Image
              key={url}
              src={url}
              alt={`Gallery image ${index + 1}`}
              width={120}
              height={80}
              unoptimized
              className="rounded-lg object-cover"
            />
          ))}
        </div>
        <ul className="mt-4 space-y-3">
          {data.features.map((feature, index) => (
            <li key={index} className="text-sm">
              <p className="font-semibold text-gray-900">{feature.title}</p>
              <p className="mt-1 break-words text-gray-700">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
        {!data.features.length && (
          <p className="text-sm text-gray-600">No key features added.</p>
        )}
      </section>
    </div>
  );
}
