const items = [
  {
    label: "AQUA",
    title: "수영장·사우나",
    description: "일상 속 휴식과 건강 관리를 고려한 프리미엄 커뮤니티 계획",
  },
  {
    label: "FITNESS",
    title: "피트니스·골프",
    description: "단지 안에서 운동과 취미를 편리하게 누릴 수 있는 공간",
  },
  {
    label: "FAMILY",
    title: "키즈·돌봄 공간",
    description: "어린이집, 돌봄센터와 가족 중심 생활을 고려한 커뮤니티",
  },
  {
    label: "LOUNGE",
    title: "D라운지·휴게 공간",
    description: "입주민의 교류와 여유로운 일상을 위한 라운지형 공간",
  },
];

export default function CommunityHighlights() {
  return (
    <section className="section communityV33" id="community">
      <div className="shell">
        <div className="communityV33Heading">
          <div>
            <p className="sectionEyebrow">PREMIUM COMMUNITY</p>
            <h2 className="sectionTitle">
              집을 넘어,
              <br />
              일상의 품격을 높이는 공간
            </h2>
          </div>
          <p className="bodyCopy">
            홍보물에 안내된 주요 커뮤니티 계획을 바탕으로 구성했습니다.
            실제 시설과 운영 방식은 사업 진행 과정에서 변경될 수 있습니다.
          </p>
        </div>

        <div className="communityV33Grid">
          {items.map((item, index) => (
            <article className="communityV33Card" key={item.title}>
              <span className="communityV33Index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <div className="communityV33Line" aria-hidden="true" />
              <span>{item.description}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
