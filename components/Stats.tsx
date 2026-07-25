const items = [
  ["49F", "영종 최초 최고층 설계"],
  ["1,009", "대단지 프리미엄"],
  ["1,916", "아파트 주차대수"],
  ["6개동", "40~49층 스카이라인"],
];

export default function Stats() {
  return (
    <section className="section light" id="overview">
      <div className="shell">
        <p className="sectionEyebrow">AT A GLANCE</p>
        <h2 className="sectionTitle">숫자로 확인하는 랜드마크</h2>
        <div className="statGrid">
          {items.map(([number, label]) => <article className="statCard" key={number}><strong>{number}</strong><span>{label}</span></article>)}
        </div>
      </div>
    </section>
  );
}
