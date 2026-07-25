/**
 * Google 스프레드시트 > 확장 프로그램 > Apps Script에 붙여넣으세요.
 * SHEET_NAME을 실제 시트명과 맞춘 뒤 '웹 앱'으로 배포합니다.
 */
const SHEET_NAME = '관심고객';
const WEBHOOK_SECRET = ''; // Next.js의 WEBHOOK_SECRET과 동일하게 설정. 비워두면 검사하지 않음.

function doPost(e) {
  try {
    if (WEBHOOK_SECRET) {
      const incoming = e.parameter.secret || '';
      // Apps Script 웹앱은 커스텀 헤더 접근이 제한적이므로 URL 파라미터 검증을 쓰려면 별도 수정이 필요합니다.
    }

    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['등록일시','이름','휴대폰','유입경로','캠페인','소재','페이지','이전페이지','IP','브라우저']);
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.source || '',
      data.campaign || '',
      data.content || '',
      data.pageUrl || '',
      data.referrer || '',
      data.ip || '',
      data.userAgent || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
