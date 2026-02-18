import { Metadata } from "next";
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Briefcase,
  MapPin,
  Building2,
  Clock,
  DollarSign,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      companyProfile: true,
    },
  });

  if (!job) {
    return {
      title: "Job Not Found | Jober",
    };
  }

  const title = `${job.title} at ${job.companyProfile.name}`;
  const description = job.description.substring(0, 160) + "...";
  const ogImage = job.jobImageUrl || job.companyProfile.logoUrl || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: "article",
      siteName: "Jober",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicJobPage({ params }: PageProps) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      companyProfile: true,
    },
  });

  if (!job || job.status !== "Active") {
    notFound();
  }

  const salaryDisplay = () => {
    if (job.salaryType === "Fixed")
      return `$${job.salaryFixed?.toLocaleString()}`;
    if (job.salaryType === "Range")
      return `$${job.salaryMin?.toLocaleString()} - $${job.salaryMax?.toLocaleString()}`;
    return "Negotiable";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-12">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Banner Image */}
        {(job.jobImageUrl || job.companyProfile.logoUrl) && (
          <div className="relative h-48 w-full">
            <img
              src={job.jobImageUrl || job.companyProfile.logoUrl || ""}
              alt={job.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="h-16 w-16 relative shrink-0 bg-white/5 rounded-2xl border border-white/10 p-2 flex items-center justify-center shadow-inner overflow-hidden">
              {job.companyProfile.logoUrl ? (
                <img
                  src={job.companyProfile.logoUrl}
                  alt={job.companyProfile.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-zinc-500" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {job.title}
              </h1>
              <div className="flex items-center gap-2 text-zinc-400 font-medium">
                <Building2 className="h-4 w-4" />
                <span>{job.companyProfile.name}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <div className="text-xs text-zinc-500 uppercase font-semibold">
                Location
              </div>
              <div className="text-sm font-medium">{job.location}</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
              <Briefcase className="h-4 w-4 text-purple-400" />
              <div className="text-xs text-zinc-500 uppercase font-semibold">
                Type
              </div>
              <div className="text-sm font-medium">{job.employmentType}</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div className="text-xs text-zinc-500 uppercase font-semibold">
                Salary
              </div>
              <div className="text-sm font-medium">{salaryDisplay()}</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <div className="text-xs text-zinc-500 uppercase font-semibold">
                Posted
              </div>
              <div className="text-sm font-medium">
                {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Ready to apply?</h3>
              <p className="text-zinc-400 max-w-sm">
                Open the Jober app to see the full details and submit your
                application instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 group"
              >
                Download Jober App
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-zinc-500 text-sm flex items-center gap-4">
        <span>&copy; 2024 Jober Inc.</span>
        <span className="h-1 w-1 bg-zinc-700 rounded-full" />
        <a href="#" className="hover:text-zinc-300 transition-colors">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}
