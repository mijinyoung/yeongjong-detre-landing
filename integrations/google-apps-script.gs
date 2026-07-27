/**
 * 영종 디에트르 Google Sheets 저장용 Apps Script — v7.3 Stable
 *
 * 표·드롭다운·스마트칩·열 유형과 충돌하지 않도록 서식 변경을 하지 않습니다.
 * 기존 데이터와 서식은 유지하고, 누락된 헤더만 오른쪽 끝에 추가합니다.
 */
const SHEET_NAME = '관심고객';
const WEBHOOK_SECRET = '여기에-Vercel과-동일한-비밀값-입력';

const REQUIRED_HEADERS = [
  '접수번호','등록일시','이름','휴대폰','유입경로','캠페인','광고소재',
  '신청위치','페이지','이전페이지','개인정보동의시각','방문분석동의',
  'IP','브라우저','처리상태','상담메모','문자상태','문자처리시각','문자상세'
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'yeongjong-detre-google-sheets',
    version: '7.3.0',
    checkedAt: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000);
    const raw = e && e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw || '{}');

    if (!isAuthorized(data)) {
      return jsonResponse({ ok: false, message: 'Unauthorized' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME) ||
      spreadsheet.insertSheet(SHEET_NAME);

    const headerMap = ensureRequiredHeaders(sheet);

    if (data.action === 'updateDelivery') {
      return updateDeliveryStatus(sheet, headerMap, data);
    }

    return appendLead(sheet, headerMap, data);
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function isAuthorized(data) {
  if (!WEBHOOK_SECRET ||
      WEBHOOK_SECRET === '여기에-Vercel과-동일한-비밀값-입력') {
    return true;
  }
  return data._webhookSecret === WEBHOOK_SECRET;
}

function ensureRequiredHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  let headers = [];

  if (sheet.getLastRow() >= 1) {
    headers = sheet.getRange(1, 1, 1, lastColumn)
      .getDisplayValues()[0]
      .map(function(value) { return String(value || '').trim(); });
  }

  const emptyHeader = headers.every(function(value) { return !value; });

  if (sheet.getLastRow() === 0 || emptyHeader) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length)
      .setValues([REQUIRED_HEADERS]);
    headers = REQUIRED_HEADERS.slice();
  } else {
    REQUIRED_HEADERS.forEach(function(header) {
      if (headers.indexOf(header) === -1) {
        sheet.getRange(1, headers.length + 1).setValue(header);
        headers.push(header);
      }
    });
  }

  const map = {};
  headers.forEach(function(header, index) {
    if (header) map[header] = index + 1;
  });
  return map;
}

function appendLead(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();

  if (leadId && findLeadRow(sheet, map, leadId)) {
    return jsonResponse({ ok: true, duplicate: true, leadId: leadId });
  }

  const row = new Array(sheet.getLastColumn()).fill('');
  put(row, map, '접수번호', leadId);
  put(row, map, '등록일시', data.submittedAt || new Date().toISOString());
  put(row, map, '이름', data.name || '');
  put(row, map, '휴대폰', data.phone || '');
  put(row, map, '유입경로', data.source || '');
  put(row, map, '캠페인', data.campaign || '');
  put(row, map, '광고소재', data.content || '');
  put(row, map, '신청위치', data.placement || '');
  put(row, map, '페이지', data.pageUrl || '');
  put(row, map, '이전페이지', data.referrer || '');
  put(row, map, '개인정보동의시각', data.consentAt || '');
  put(row, map, '방문분석동의', data.analyticsConsent ? '동의' : '미동의');
  put(row, map, 'IP', data.ip || '');
  put(row, map, '브라우저', data.userAgent || '');
  put(row, map, '처리상태', '신규');
  put(row, map, '문자상태', data.smsConfigured === false ? '미설정' : '대기');

  sheet.appendRow(row);
  return jsonResponse({ ok: true, leadId: leadId, row: sheet.getLastRow() });
}

function updateDeliveryStatus(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });

  setByHeader(sheet, row, map, '문자상태', data.smsStatus || '확인필요');
  setByHeader(sheet, row, map, '문자처리시각',
    data.smsProcessedAt || new Date().toISOString());
  setByHeader(sheet, row, map, '문자상세', data.smsDetail || '');

  return jsonResponse({ ok: true, updated: true, leadId: leadId, row: row });
}

function findLeadRow(sheet, map, leadId) {
  const column = map['접수번호'];
  if (!column || !leadId || sheet.getLastRow() < 2) return 0;

  const found = sheet.getRange(2, column, sheet.getLastRow() - 1, 1)
    .createTextFinder(leadId)
    .matchEntireCell(true)
    .findNext();

  return found ? found.getRow() : 0;
}

function put(row, map, header, value) {
  const column = map[header];
  if (column) row[column - 1] = value;
}

function setByHeader(sheet, row, map, header, value) {
  const column = map[header];
  if (column) sheet.getRange(row, column).setValue(value);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
