/**
 * 영종 디에트르 관심고객 Google Sheets 저장용 Apps Script
 *
 * 설치 순서
 * 1. Google 스프레드시트 생성
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 파일 전체 붙여넣기
 * 4. WEBHOOK_SECRET을 Vercel의 WEBHOOK_SECRET과 동일하게 입력
 * 5. 배포 → 새 배포 → 웹 앱
 * 6. 실행 사용자: 나 / 액세스 권한: 모든 사용자
 * 7. 생성된 웹 앱 URL을 Vercel의 GOOGLE_SHEET_WEBHOOK_URL에 입력
 */

const SHEET_NAME = '관심고객';
const WEBHOOK_SECRET = '여기에-Vercel과-동일한-비밀값-입력';

const HEADERS = [
  '접수번호',
  '등록일시',
  '이름',
  '휴대폰',
  '유입경로',
  '캠페인',
  '광고소재',
  '신청위치',
  '페이지',
  '이전페이지',
  '개인정보동의시각',
  '방문분석동의',
  'IP',
  '브라우저',
  '처리상태',
  '상담메모',
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'yeongjong-detre-google-sheets',
    checkedAt: new Date().toISOString(),
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000);

    const raw = e && e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw || '{}');

    if (
      WEBHOOK_SECRET &&
      WEBHOOK_SECRET !== '여기에-Vercel과-동일한-비밀값-입력' &&
      data._webhookSecret !== WEBHOOK_SECRET
    ) {
      return jsonResponse({ ok: false, message: 'Unauthorized' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME) ||
      spreadsheet.insertSheet(SHEET_NAME);

    initializeSheet(sheet);

    const leadId = String(data.leadId || '').trim();

    if (leadId && isDuplicateLead(sheet, leadId)) {
      return jsonResponse({
        ok: true,
        duplicate: true,
        leadId,
      });
    }

    sheet.appendRow([
      leadId,
      data.submittedAt || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.source || '',
      data.campaign || '',
      data.content || '',
      data.placement || '',
      data.pageUrl || '',
      data.referrer || '',
      data.consentAt || '',
      data.analyticsConsent ? '동의' : '미동의',
      data.ip || '',
      data.userAgent || '',
      '신규',
      '',
    ]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(lastRow, 11).setNumberFormat('yyyy-mm-dd hh:mm:ss');

    return jsonResponse({
      ok: true,
      leadId,
      row: lastRow,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: String(error),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function initializeSheet(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);

  const header = sheet.getRange(1, 1, 1, HEADERS.length);
  header
    .setFontWeight('bold')
    .setBackground('#0b1730')
    .setFontColor('#ffffff');

  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(7, 180);
  sheet.setColumnWidth(8, 140);
  sheet.setColumnWidth(9, 260);
  sheet.setColumnWidth(10, 260);
  sheet.setColumnWidth(11, 160);
  sheet.setColumnWidth(12, 110);
  sheet.setColumnWidth(13, 120);
  sheet.setColumnWidth(14, 260);
  sheet.setColumnWidth(15, 100);
  sheet.setColumnWidth(16, 280);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['신규', '연락완료', '상담중', '방문예약', '계약', '보류'], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange('O2:O').setDataValidation(statusRule);
}

function isDuplicateLead(sheet, leadId) {
  if (sheet.getLastRow() < 2) return false;

  const finder = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(leadId)
    .matchEntireCell(true)
    .findNext();

  return Boolean(finder);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
