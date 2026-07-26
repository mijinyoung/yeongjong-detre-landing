const premiums = [
  { no: "01", title: "청라하늘대교 생활권", text: "영종과 청라를 잇는 새로운 연결로 확장되는 생활 반경" },
  { no: "02", title: "오션뷰 스카이라인", text: "최고 49층 설계와 커튼월룩이 만드는 상징적인 외관" },
  { no: "03", title: "여유로운 주차", text: "아파트 1,916대, 세대당 약 1.9대 수준의 주차 계획" },
  { no: "04", title: "다채로운 주거 타입", text: "84㎡·104㎡·113㎡ A·B 타입으로 구성된 1,009세대" },
];

export default function Premium() {
  return (
    <section className="section navy" id="premium">
      <div className="shell">
        <p className="sectionEyebrow gold">PREMIUM</p>
        <h2 className="sectionTitle white">영종의 기준을 새롭게</h2>
        <div className="premiumGrid">
          {premiums.map((item) => <article className="premiumCard" key={item.no}><span>{item.no}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </div>
    </section>
  );
}
