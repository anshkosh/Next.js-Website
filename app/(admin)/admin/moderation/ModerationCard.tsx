"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Check, X, Eye, Play, MapPin, Calendar, Link, Building2 } from "lucide-react";
import { approveStartup, rejectStartup } from "@/app/actions/admin.actions";

export default function ModerationCard({ startup }: { startup: any }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    await approveStartup(startup.id);
    setIsApproving(false);
  };

  const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRejecting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", startup.id);
    await rejectStartup(formData);
    setIsRejecting(false);
    setShowRejectDialog(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex gap-4 items-start">
          {startup.logoUrl ? (
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 flex overflow-hidden border border-gray-200">
              <Image
                src={startup.logoUrl}
                alt={startup.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 border border-gray-200">
              {startup.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold truncate">{startup.name}</h3>
                <p className="text-gray-600 truncate">{startup.tagline}</p>
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                {startup.category.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Founder</span>
                <span className="font-medium">{startup.founder?.name}</span>
                <span className="text-gray-500 block text-xs">
                  {startup.founder?.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Details</span>
                {startup.websiteUrl && (
                  <a
                    href={startup.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-coral-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    Website <ExternalLink size={14} />
                  </a>
                )}
                <span className="text-gray-500 block text-xs mt-1">
                  Submitted {new Date(startup.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-gray-500 block text-sm mb-1">
                Description
              </span>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100 leading-relaxed">
                {startup.description.length > 200
                  ? startup.description.substring(0, 200) + "..."
                  : startup.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowDetailsDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
        >
          <Eye size={18} /> View Details
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowRejectDialog(true)}
            disabled={isApproving || isRejecting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <X size={18} /> Reject
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check size={18} /> {isApproving ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-2">Reject {startup.name}</h3>
            <p className="text-gray-500 text-sm mb-4">
              Please provide a reason for rejecting this startup. The founder
              will receive this via email.
            </p>

            <form onSubmit={handleReject}>
              <textarea
                name="adminNotes"
                required
                placeholder="Reason for rejection..."
                className="w-full border border-gray-300 rounded-md p-3 h-32 mb-4 focus:ring-red-500 focus:border-red-500 outline-none"
              ></textarea>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-4">
                {startup.logoUrl ? (
                  <img src={startup.logoUrl} alt={startup.name} className="w-12 h-12 rounded-lg border border-gray-200 object-cover bg-white" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 border border-gray-200">
                    {startup.name.substring(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold font-heading text-gray-900">{startup.name}</h3>
                  <p className="text-sm text-gray-500">{startup.tagline}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsDialog(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Full Description */}
                  <section>
                    <h4 className="text-lg font-bold font-heading mb-3">About</h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {startup.description}
                    </p>
                  </section>

                  {/* Video Demo */}
                  {startup.videoUrl && (
                    <section>
                      <h4 className="text-lg font-bold font-heading mb-3 flex items-center gap-2">
                        <Play size={18} className="text-coral-500" /> Video Demo
                      </h4>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {(() => {
                          const yt = startup.videoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
                          const vim = startup.videoUrl.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
                          const embedUrl = yt && yt[2].length === 11 
                            ? `https://www.youtube.com/embed/${yt[2]}` 
                            : vim ? `https://player.vimeo.com/video/${vim[1]}` : null;
                          if (embedUrl) return <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>;
                          return <div className="flex items-center justify-center h-full text-gray-400">Preview not available. <a href={startup.videoUrl} target="_blank" className="ml-1 text-blue-500 hover:underline">Open link</a></div>;
                        })()}
                      </div>
                    </section>
                  )}

                  {/* Gallery */}
                  {startup.galleryImages && startup.galleryImages.length > 0 && (
                    <section>
                      <h4 className="text-lg font-bold font-heading mb-3">Gallery</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {startup.galleryImages.map((img: string, idx: number) => (
                          <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Features */}
                  {startup.metadata?.features && startup.metadata.features.length > 0 && (
                    <section>
                      <h4 className="text-lg font-bold font-heading mb-3">Key Features</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {startup.metadata.features.map((feature: any, idx: number) => (
                          <div key={idx} className="p-4 border border-gray-100 bg-gray-50 rounded-xl flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-coral-50 text-coral-500 flex items-center justify-center shrink-0">
                              <Check size={16} /> {/* Static icon for preview */}
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900 text-sm mb-1">{feature.title}</h5>
                              <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Basic Metadata */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500 flex items-center gap-1.5 shrink-0"><Building2 size={16}/> Category</span>
                        <span className="font-medium text-right">{startup.category?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><MapPin size={16}/> City</span>
                        <span className="font-medium text-right max-w-[140px] truncate">{startup.metadata?.city || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={16}/> Founded</span>
                        <span className="font-medium">{startup.metadata?.foundedYear || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Links</h4>
                    <div className="space-y-3 text-sm flex flex-col">
                      <a href={startup.websiteUrl} target="_blank" className="flex items-center gap-2 text-coral-500 hover:underline">
                        <ExternalLink size={16} /> Website URL
                      </a>
                      {startup.metadata?.twitterUrl && (
                        <a href={startup.metadata.twitterUrl} target="_blank" className="flex items-center gap-2 text-blue-400 hover:underline">
                          <Link size={16} /> Twitter Profile
                        </a>
                      )}
                      {startup.metadata?.linkedinUrl && (
                        <a href={startup.metadata.linkedinUrl} target="_blank" className="flex items-center gap-2 text-blue-700 hover:underline">
                          <Link size={16} /> LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Team */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Team</h4>
                    <div className="space-y-4">
                      {/* Submitting Founder */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-bold text-sm shrink-0 border border-coral-200">
                          {startup.founder?.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{startup.founder?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{startup.founder?.email}</p>
                        </div>
                      </div>
                      
                      {/* Extra Founders */}
                      {startup.founders && startup.founders.map((f: any) => (
                        <div key={f.id} className="flex items-center gap-3 pt-3 border-t border-gray-200/60">
                          {f.photoUrl ? (
                            <img src={f.photoUrl} alt={f.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {f.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{f.name}</p>
                            <p className="text-xs text-gray-500 truncate">{f.role || "Co-founder"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl shrink-0 flex justify-end">
               <button onClick={() => setShowDetailsDialog(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                 Close Details
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
