/**
 * 영종 디에트르 관심고객 Google Sheets 저장용 Apps Script — v7.2
 *
 * 설치 순서
 * 1. Google 스프레드시트 → 확장 프로그램 → Apps Script
 * 2. 이 파일 전체 붙여넣기
 * 3. WEBHOOK_SECRET을 Vercel의 WEBHOOK_SECRET과 동일하게 입력
 * 4. 배포 → 배포 관리 → 기존 웹앱 수정 → 새 버전 → 배포
 *
 * 기존 관심고객 탭이 있어도 누락된 열은 자동으로 추가됩니다.
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
  '문자상태',
  '문자처리시각',
  '문자상세',
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'yeongjong-detre-google-sheets',
    version: '7.2.0',
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

    ensureSheetSchema(sheet);

    if (data.action === 'updateDelivery') {
      return updateDeliveryStatus(sheet, data);
    }

    return appendLead(sheet, data);
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

function appendLead(sheet, data) {
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
    data.smsConfigured === false ? '미설정' : '대기',
    '',
    '',
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(lastRow, 11).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(lastRow, 18).setNumberFormat('yyyy-mm-dd hh:mm:ss');

  return jsonResponse({
    ok: true,
    leadId,
    row: lastRow,
  });
}

function updateDeliveryStatus(sheet, data) {
  const leadId = String(data.leadId || '').trim();
  if (!leadId) {
    return jsonResponse({ ok: false, message: 'leadId is required' });
  }

  const row = findLeadRow(sheet, leadId);
  if (!row) {
    return jsonResponse({
      ok: false,
      message: 'Lead row not found',
      leadId,
    });
  }

  sheet.getRange(row, 17).setValue(data.smsStatus || '확인필요');
  sheet.getRange(row, 18).setValue(data.smsProcessedAt || new Date().toISOString());
  sheet.getRange(row, 19).setValue(data.smsDetail || '');
  sheet.getRange(row, 18).setNumberFormat('yyyy-mm-dd hh:mm:ss');

  return jsonResponse({
    ok: true,
    updated: true,
    leadId,
    row,
  });
}

function ensureSheetSchema(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  const existingLastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet
    .getRange(1, 1, 1, existingLastColumn)
    .getValues()[0]
    .map(String);

  HEADERS.forEach(function(header) {
    if (existingHeaders.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      existingHeaders.push(header);
    }
  });

  sheet.setFrozenRows(1);

  const header = sheet.getRange(1, 1, 1, HEADERS.length);
  header
    .setFontWeight('bold')
    .setBackground('#0b1730')
    .setFontColor('#ffffff');

  const widths = [
    180, 160, 100, 140, 120, 180, 180, 140, 260, 260,
    160, 110, 120, 260, 100, 280, 100, 160, 280,
  ];

  widths.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['신규', '연락완료', '상담중', '방문예약', '계약', '보류'], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange('O2:O').setDataValidation(statusRule);
}

function findLeadRow(sheet, leadId) {
  if (sheet.getLastRow() < 2) return 0;

  const finder = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(leadId)
    .matchEntireCell(true)
    .findNext();

  return finder ? finder.getRow() : 0;
}

function isDuplicateLead(sheet, leadId) {
  return Boolean(findLeadRow(sheet, leadId));
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
