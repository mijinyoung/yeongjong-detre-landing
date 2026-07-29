/**
 * 영종 디에트르 Google Sheets 저장·관리자 운영용 Apps Script — v10.0
 *
 * 표·드롭다운·스마트칩·열 유형과 충돌하지 않도록 서식 변경을 하지 않습니다.
 * 기존 데이터와 서식은 유지하고, 누락된 헤더만 오른쪽 끝에 추가합니다.
 *
 * 권장 설정: Apps Script의 프로젝트 설정 > 스크립트 속성에
 * WEBHOOK_SECRET을 추가하고 Vercel의 GOOGLE_SHEET_WEBHOOK_SECRET과 같은 값을 입력합니다.
 */
const SHEET_NAME = '관심고객';
const WEBHOOK_SECRET_FALLBACK = '여기에-Vercel과-동일한-비밀값-입력';

const REQUIRED_HEADERS = [
  '접수번호','등록일시','이름','휴대폰','유입경로','캠페인','광고소재',
  '신청위치','페이지','이전페이지','개인정보동의시각','방문분석동의',
  'IP','브라우저','처리상태','상담메모','문자상태','문자처리시각','문자상세',
  '이벤트ID'
];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  if (params.action === 'list') {
    return jsonResponse({ ok: false, message: 'Use an authenticated POST request.' });
  }

  return jsonResponse({
    ok: true,
    service: 'yeongjong-detre-google-sheets',
    version: '10.0.0',
    checkedAt: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;

  try {
    const raw = e && e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw || '{}');

    if (!isAuthorized(data)) {
      return jsonResponse({ ok: false, message: 'Unauthorized' });
    }

    if (data.action === 'list') {
      return listLeads(data);
    }
    if (data.action === 'getLead') {
      return getLeadDetail(data);
    }

    const action = String(data.action || 'appendLead');
    if (['appendLead', 'updateDelivery', 'updateLead'].indexOf(action) === -1) {
      return jsonResponse({ ok: false, code: 'INVALID_ACTION', message: 'Invalid action' });
    }

    if (!lock.tryLock(5000)) {
      return jsonResponse({
        ok: false,
        code: 'BUSY',
        message: 'The sheet is busy. Retry with the same eventId.'
      });
    }
    locked = true;

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME) ||
      spreadsheet.insertSheet(SHEET_NAME);

    const headerMap = ensureRequiredHeaders(sheet);

    if (action === 'updateDelivery') {
      return updateDeliveryStatus(sheet, headerMap, data);
    }

    if (action === 'updateLead') {
      return updateLeadStatus(sheet, headerMap, data);
    }

    return appendLead(sheet, headerMap, data);
  } catch (error) {
    return jsonResponse({ ok: false, message: String(error) });
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (_) {}
    }
  }
}

function isAuthorized(data) {
  const propertySecret = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_SECRET');
  const configuredSecret = String(propertySecret || WEBHOOK_SECRET_FALLBACK || '').trim();

  if (!configuredSecret ||
      configuredSecret === '여기에-Vercel과-동일한-비밀값-입력') {
    return false;
  }
  return String(data && data._webhookSecret || '') === configuredSecret;
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
  const eventId = String(data.eventId || '').trim();
  const phone = String(data.phone || '').trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/.test(eventId)) {
    return jsonResponse({
      ok: false,
      code: 'INVALID_EVENT_ID',
      message: 'A valid eventId is required'
    });
  }

  const eventRow = findExactRow(sheet, map, '이벤트ID', eventId);
  if (eventRow) {
    const existingPhone = readSheetCell(sheet, eventRow, map, '휴대폰');
    if (phoneDigits(existingPhone) !== phoneDigits(phone)) {
      return jsonResponse({
        ok: false,
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'The eventId belongs to a different lead'
      });
    }

    return jsonResponse({
      ok: true,
      duplicate: true,
      leadId: readSheetCell(sheet, eventRow, map, '접수번호'),
      eventId: eventId,
      smsStatus: readSheetCell(sheet, eventRow, map, '문자상태'),
      row: eventRow
    });
  }

  if (leadId && findLeadRow(sheet, map, leadId)) {
    return jsonResponse({
      ok: false,
      code: 'LEAD_ID_CONFLICT',
      message: 'Lead ID already exists'
    });
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
  put(row, map, '이벤트ID', eventId);

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return jsonResponse({
    ok: true,
    duplicate: false,
    leadId: leadId,
    eventId: eventId,
    row: sheet.getLastRow()
  });
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

function updateLeadStatus(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();
  const status = String(data.status || '').trim();
  const memo = String(data.memo || '').trim().slice(0, 1000);
  const allowedStatuses = ['신규', '연락완료', '상담중', '방문예약', '계약', '보류'];
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });
  if (allowedStatuses.indexOf(status) === -1) {
    return jsonResponse({ ok: false, message: 'Invalid status' });
  }

  setByHeader(sheet, row, map, '처리상태', status);
  setByHeader(sheet, row, map, '상담메모', memo);

  return jsonResponse({
    ok: true,
    updated: true,
    leadId: leadId,
    status: status,
    memo: memo,
    row: row
  });
}


function listLeads(params) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({
      ok: true,
      leads: [],
      total: 0,
      updatedAt: new Date().toISOString()
    });
  }

  const map = readHeaderMap(sheet);
  const total = sheet.getLastRow() - 1;
  const requestedLimit = Number(params.limit || 200);
  const limit = Math.max(1, Math.min(200, requestedLimit));
  const startRow = Math.max(2, sheet.getLastRow() - limit + 1);
  const rowCount = sheet.getLastRow() - startRow + 1;
  const values = sheet.getRange(startRow, 1, rowCount, sheet.getLastColumn())
    .getDisplayValues();

  const leads = values.reverse().map(function(row) {
    return {
      leadId: read(row, map, '접수번호'),
      submittedAt: read(row, map, '등록일시'),
      name: read(row, map, '이름'),
      phone: read(row, map, '휴대폰'),
      source: read(row, map, '유입경로'),
      campaign: read(row, map, '캠페인'),
      placement: read(row, map, '신청위치'),
      status: read(row, map, '처리상태') || '신규',
      smsStatus: read(row, map, '문자상태'),
      memo: read(row, map, '상담메모')
    };
  });

  return jsonResponse({
    ok: true,
    leads: leads,
    total: total,
    updatedAt: new Date().toISOString()
  });
}

function getLeadDetail(data) {
  const leadId = String(data.leadId || '').trim();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ ok: false, message: 'Lead row not found' });
  }

  const map = readHeaderMap(sheet);
  const row = findLeadRow(sheet, map, leadId);
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found' });

  const phoneColumn = map['휴대폰'];
  const phone = phoneColumn
    ? sheet.getRange(row, phoneColumn).getDisplayValue()
    : '';

  return jsonResponse({ ok: true, leadId: leadId, phone: phone });
}

function read(row, map, header) {
  const column = map[header];
  return column ? String(row[column - 1] || '') : '';
}

function findLeadRow(sheet, map, leadId) {
  return findExactRow(sheet, map, '접수번호', leadId);
}

function findExactRow(sheet, map, header, value) {
  const column = map[header];
  if (!column || !value || sheet.getLastRow() < 2) return 0;

  const found = sheet.getRange(2, column, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(value))
    .matchEntireCell(true)
    .matchCase(true)
    .useRegularExpression(false)
    .findNext();

  return found ? found.getRow() : 0;
}

function readHeaderMap(sheet) {
  const map = {};
  if (!sheet || sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) return map;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  headers.forEach(function(header, index) {
    const normalized = String(header || '').trim();
    if (normalized) map[normalized] = index + 1;
  });
  return map;
}

function readSheetCell(sheet, row, map, header) {
  const column = map[header];
  return column ? String(sheet.getRange(row, column).getDisplayValue() || '') : '';
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function put(row, map, header, value) {
  const column = map[header];
  if (column) row[column - 1] = sheetText(value);
}

function setByHeader(sheet, row, map, header, value) {
  const column = map[header];
  if (column) sheet.getRange(row, column).setValue(sheetText(value));
}

function sheetText(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
