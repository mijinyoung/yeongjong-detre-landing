const routes = [
  { time: "약 5분", title: "제3연륙교 통과", text: "영종·청라 생활권을 빠르게 연결" },
  { time: "약 7분", title: "청라 접근", text: "개통 후 청라 생활 인프라 이용" },
  { time: "약 15분", title: "인천국제공항", text: "공항 종사자 직주근접 생활권" },
  { time: "약 30분", title: "여의도", text: "광역 이동 편의 개선 기대" },
];

export default function Location() {
  return (
    <section className="section locationSection" id="location">
      <div className="shell">
        <p className="sectionEyebrow">LOCATION</p>
        <div className="locationHeading">
          <h2 className="sectionTitle">제3연륙교로 완성되는<br />영종·청라 ONE 생활권</h2>
          <p className="bodyCopy">교통 상황에 따라 실제 이동시간은 달라질 수 있으며, 상세 내용은 공식 자료를 확인하시기 바랍니다.</p>
        </div>
        <div className="routeGrid">
          {routes.map((route) => (
            <article className="routeCard" key={route.title}>
              <strong>{route.time}</strong>
              <h3>{route.title}</h3>
              <p>{route.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
