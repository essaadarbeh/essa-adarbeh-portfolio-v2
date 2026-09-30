import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/case/CaseStudy";
import Footer from "@/components/Footer";
import { cases } from "@/data/cases";
import { projects } from "@/data/projects";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.title}: ${p.summary} | ${site.name}`,
    description: p.description,
    openGraph: { title: `${p.title} case study`, description: p.description, images: [p.cover.src] },
  };
}

export default async function CasePage({ params }: Params) {
  const { slug } = await params;
  if (!(slug in cases)) notFound();
  return (
    <>
      <CaseStudy slug={slug as keyof typeof cases} />
      <Footer />
    </>
  );
}
