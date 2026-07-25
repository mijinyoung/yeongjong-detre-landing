import Image from "next/image";

export default function Landmark() {
  return (
    <section className="section warm">
      <div className="shell split">
        <div>
          <p className="sectionEyebrow">LANDMARK DESIGN</p>
          <h2 className="sectionTitle">밤에도 빛나는<br />영종의 새로운 장면</h2>
          <p className="bodyCopy">커튼월룩 외관과 야간 특화조명이 어우러져, 일상 속에서도 특별한 귀가 경험과 도시의 새로운 풍경을 제안합니다.</p>
          <ul className="checkList"><li>최고 49층 스카이라인</li><li>야간 특화조명</li><li>커튼월룩 외관</li><li>중앙광장과 조경 특화</li></ul>
        </div>
        <div className="imageFrame"><Image src="/images/hero.jpg" alt="영종 디에트르 라 메르 야경 투시도" width={905} height={965} className="landmarkImage" /></div>
      </div>
    </section>
  );
}
