import Image from "next/image";
import Link from "next/link";
import AnshkoshMascot from "@/components/site/AnshkoshMascot";

type Founder = {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
};

export default function FoundersSection({ founders, editHref }: { founders: Founder[]; editHref?: string }) {
  // Keep the team visible as a question even before founders are added.
  if (!founders || founders.length === 0) {
    return (
      <section aria-labelledby="team-empty-title" className="mb-12 flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
        <AnshkoshMascot size={96} />
        <div>
          <h2 id="team-empty-title" className="font-heading text-2xl font-bold text-gray-900">Team not yet added</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
            {editHref ? "Kosh is curious who is behind this. Add your founding team so visitors know who is building it." : "Kosh is still waiting to meet the people behind this startup. You can ask the founder in Questions below."}
          </p>
          {editHref && <Link href={editHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-coral-600 px-5 py-2 text-sm font-semibold text-white hover:bg-coral-700">Add your team</Link>}
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 font-heading">Meet the Founders</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {founders.map((founder) => (
          <div key={founder.id} className="flex flex-col items-center p-6 border border-gray-100 rounded-xl bg-gray-50/50 text-center">
            <div className="w-24 h-24 mb-4 relative rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200 flex-shrink-0">
              {founder.photoUrl ? (
                <Image src={founder.photoUrl} alt={founder.name} fill sizes="96px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
                  {founder.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{founder.name}</h3>
            {founder.role && <p className="text-sm text-gray-500 mb-4">{founder.role}</p>}
            
            {(founder.twitterUrl || founder.linkedinUrl) && (
              <div className="flex items-center gap-3 mt-auto pt-2">
                {founder.twitterUrl && (
                  <a href={founder.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1DA1F2] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                )}
                {founder.linkedinUrl && (
                  <a href={founder.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#0A66C2] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
