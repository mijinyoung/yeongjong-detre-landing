import Image from "next/image";
import { projectConfig } from "@/data/project-config";

export default function Features() {
  const section = projectConfig.sections.landmark;

  return (
    <section className="bg-slate-900 py-24 text-white">

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        <div>

          <p className="text-amber-400 uppercase tracking-[0.4em]">
            LANDMARK VALUE
          </p>

          <h2 className="mt-4 text-5xl font-bold leading-tight">
            {section.titleLines[0]}
            <br />
            {section.titleLines[1]}
          </h2>

          <p className="mt-8 leading-8 text-gray-300">
            {section.description}
          </p>

        </div>

        <div className="overflow-hidden rounded-3xl shadow-2xl">

          <Image
            src={section.image}
            alt={section.imageAlt}
            width={1200}
            height={800}
            className="w-full object-cover"
          />

        </div>

      </div>

    </section>
  );
}
