import Image from "next/image";

export default function Features() {
  return (
    <section className="bg-slate-900 py-24 text-white">

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        <div>

          <p className="text-amber-400 uppercase tracking-[0.4em]">
            LANDMARK VALUE
          </p>

          <h2 className="mt-4 text-5xl font-bold leading-tight">
            영종을 대표하는
            <br />
            랜드마크
          </h2>

          <p className="mt-8 leading-8 text-gray-300">
            빛의 프리미엄,
            호텔라이크 동선,
            랜드마크 스카이라인,
            조경과 광장을 중심으로
            새로운 영종의 중심이 됩니다.
          </p>

        </div>

        <div className="overflow-hidden rounded-3xl shadow-2xl">

          <Image
            src="/images/night-view.png"
            alt="조감도"
            width={1200}
            height={800}
            className="w-full object-cover"
          />

        </div>

      </div>

    </section>
  );
}