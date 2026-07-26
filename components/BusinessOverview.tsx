const overview = [
  { label: "공급 위치", value: "인천광역시 중구 중산동 1958-8·9" },
  { label: "단지 규모", value: "지하 3층~지상 최고 49층, 아파트 6개동" },
  { label: "총 세대수", value: "아파트 총 1,009세대" },
  { label: "주거 타입", value: "84㎡·104㎡·113㎡ A·B" },
  { label: "아파트 주차", value: "총 1,916대" },
  { label: "입주 예정", value: "2029년 10월 예정" },
];

export default function BusinessOverview() {
  return (
    <section className="section overviewV40" id="business-overview">
      <div className="shell">
        <div className="overviewV40Heading">
          <div>
            <p className="sectionEyebrow">PROJECT OVERVIEW</p>
            <h2 className="sectionTitle">영종의 새로운 기준을 세우는<br />대단지 랜드마크</h2>
          </div>
          <p className="bodyCopy">
            핵심 사업 정보를 한눈에 확인하세요. 세부 조건과 정확한 내용은
            입주자모집공고 및 견본주택 안내를 우선합니다.
          </p>
        </div>

        <div className="overviewV40Grid">
          {overview.map((item, index) => (
            <article key={item.label} className="overviewV40Item">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
