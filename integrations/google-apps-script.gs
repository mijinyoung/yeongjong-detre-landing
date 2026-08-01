/**
 * 현장 복제형 Google Sheets 저장·관리자 운영용 Apps Script — v16.0
 *
 * 기존 데이터와 서식은 유지하고, 누락된 헤더만 오른쪽 끝에 추가합니다.
 * 시간 열은 한국시간의 실제 날짜 값으로 저장하고 읽기 쉬운 형식만 적용합니다.
 *
 * v15부터 웹 앱 주소에서 자동 생성한 연결 키를 사용합니다.
 * 기존 WEBHOOK_SECRET은 순차 배포 호환용으로만 계속 지원합니다.
 */
const PROJECT_CODE = 'yeongjong-detre';
const SHEET_NAME = '관심고객';
const SHEET_CONNECTION_VERSION = 'YD_SHEET_CAPABILITY_V1';
const WEBHOOK_SECRET_FALLBACK = '여기에-Vercel과-동일한-비밀값-입력';
const KOREAN_TIME_ZONE = 'Asia/Seoul';
const TIMESTAMP_NUMBER_FORMAT = 'yyyy-mm-dd hh:mm:ss';
const TIMESTAMP_MIGRATION_VERSION = 'V160';
const CONVERSION_PROCESSING_LEASE_MS = 5 * 60 * 1000;
const TIMESTAMP_HEADERS = [
  '등록일시', '개인정보동의시각', '문자처리시각', '광고전환처리시각'
];

const REQUIRED_HEADERS = [
  '접수번호','현장코드','현장명','등록일시','이름','휴대폰','유입경로','매체유형','캠페인','광고소재','검색어',
  'Google클릭ID','Meta클릭ID',
  '신청위치','페이지','이전페이지','개인정보동의시각','방문분석동의',
  'IP','브라우저','처리상태','상담메모','문자상태','문자처리시각','문자상세',
  '이벤트ID', '광고전환상태', '광고전환처리시각', '광고전환상세'
];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  if (params.action === 'list') {
    return jsonResponse({ ok: false, message: 'Use an authenticated POST request.' });
  }

  return jsonResponse({
    ok: true,
    service: PROJECT_CODE + '-google-sheets',
    version: '16.0.0',
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
    if ([
      'appendLead', 'claimDelivery', 'updateDelivery',
      'claimConversion', 'updateConversion', 'updateLead'
    ].indexOf(action) === -1) {
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
    prepareTimestampColumns(spreadsheet, sheet, headerMap);

    if (action === 'claimDelivery') {
      return claimPendingStatus(sheet, headerMap, data, '문자상태', 'delivery');
    }

    if (action === 'updateDelivery') {
      return updateDeliveryStatus(sheet, headerMap, data);
    }

    if (action === 'claimConversion') {
      return claimPendingStatus(sheet, headerMap, data, '광고전환상태', 'conversion');
    }

    if (action === 'updateConversion') {
      return updateConversionStatus(sheet, headerMap, data);
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
  const expectedConnectionKey = createSheetConnectionKey();
  const receivedConnectionKey = String(
    data && data._sheetConnectionKey || ''
  ).trim();
  if (expectedConnectionKey &&
      receivedConnectionKey === expectedConnectionKey) {
    return true;
  }

  // v14 이하 배포와의 순차 전환을 위해 기존 비밀번호도 계속 허용합니다.
  const propertySecret = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_SECRET');
  const configuredSecret = String(propertySecret || WEBHOOK_SECRET_FALLBACK || '').trim();

  if (!configuredSecret ||
      configuredSecret === '여기에-Vercel과-동일한-비밀값-입력') {
    return false;
  }
  return String(data && data._webhookSecret || '') === configuredSecret;
}

function createSheetConnectionKey() {
  const serviceUrl = String(ScriptApp.getService().getUrl() || '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
  if (!serviceUrl) return '';

  const input =
    serviceUrl + '|' + PROJECT_CODE + '|' + SHEET_CONNECTION_VERSION;
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );

  return digest.map(function(value) {
    return ('0' + ((value + 256) % 256).toString(16)).slice(-2);
  }).join('');
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
      conversionStatus: readSheetCell(sheet, eventRow, map, '광고전환상태'),
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
  put(row, map, '현장코드', data.projectCode || PROJECT_CODE);
  put(row, map, '현장명', data.projectName || '');
  putTimestamp(row, map, '등록일시', data.submittedAt || new Date());
  put(row, map, '이름', data.name || '');
  put(row, map, '휴대폰', data.phone || '');
  put(row, map, '유입경로', data.source || '');
  put(row, map, '매체유형', data.medium || '');
  put(row, map, '캠페인', data.campaign || '');
  put(row, map, '광고소재', data.content || '');
  put(row, map, '검색어', data.term || '');
  put(row, map, 'Google클릭ID', data.gclid || '');
  put(row, map, 'Meta클릭ID', data.fbclid || '');
  put(row, map, '신청위치', data.placement || '');
  put(row, map, '페이지', data.landingPage || data.pageUrl || '');
  put(row, map, '이전페이지', data.landingReferrer || data.referrer || '');
  putTimestamp(row, map, '개인정보동의시각', data.consentAt || '');
  put(row, map, '방문분석동의', data.analyticsConsent ? '동의' : '미동의');
  put(row, map, 'IP', data.ip || '');
  put(row, map, '브라우저', data.userAgent || '');
  put(row, map, '처리상태', '신규');
  put(row, map, '문자상태', data.smsConfigured === false ? '미설정' : '대기');
  put(row, map, '이벤트ID', eventId);
  put(row, map, '광고전환상태',
    data.analyticsConsent !== true
      ? '미동의'
      : data.metaConversionConfigured === true
        ? '대기'
        : '미설정');

  sheet.appendRow(row);
  const appendedRow = sheet.getLastRow();
  formatTimestampCells(sheet, appendedRow, map);
  SpreadsheetApp.flush();
  return jsonResponse({
    ok: true,
    duplicate: false,
    leadId: leadId,
    eventId: eventId,
    row: appendedRow
  });
}

function updateDeliveryStatus(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });

  setByHeader(sheet, row, map, '문자상태', data.smsStatus || '확인필요');
  setTimestampByHeader(sheet, row, map, '문자처리시각',
    data.smsProcessedAt || new Date().toISOString());
  setByHeader(sheet, row, map, '문자상세', data.smsDetail || '');

  return jsonResponse({ ok: true, updated: true, leadId: leadId, row: row });
}

function claimPendingStatus(sheet, map, data, header, task) {
  const leadId = String(data.leadId || '').trim();
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });

  const currentStatus = readSheetCell(sheet, row, map, header);
  const timeHeader = task === 'delivery'
    ? '문자처리시각'
    : '광고전환처리시각';
  const timeColumn = map[timeHeader];
  const processingValue = timeColumn
    ? sheet.getRange(row, timeColumn).getValue()
    : '';
  const processingStartedAt = processingValue instanceof Date
    ? processingValue.getTime()
    : NaN;
  const staleProcessing =
    task === 'conversion' &&
    currentStatus === '처리중' &&
    Number.isFinite(processingStartedAt) &&
    Date.now() - processingStartedAt >= CONVERSION_PROCESSING_LEASE_MS;

  if (currentStatus !== '대기' && !staleProcessing) {
    return jsonResponse({
      ok: true,
      claimed: false,
      task: task,
      status: currentStatus,
      leadId: leadId,
      row: row
    });
  }

  setByHeader(sheet, row, map, header, '처리중');
  setTimestampByHeader(sheet, row, map, timeHeader, new Date());
  SpreadsheetApp.flush();
  return jsonResponse({
    ok: true,
    claimed: true,
    reclaimed: staleProcessing,
    task: task,
    status: '처리중',
    leadId: leadId,
    row: row
  });
}

function updateConversionStatus(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });

  setByHeader(sheet, row, map, '광고전환상태', data.conversionStatus || '확인필요');
  setTimestampByHeader(sheet, row, map, '광고전환처리시각',
    data.conversionProcessedAt || new Date().toISOString());
  setByHeader(sheet, row, map, '광고전환상세', data.conversionDetail || '');

  return jsonResponse({ ok: true, updated: true, leadId: leadId, row: row });
}

function updateLeadStatus(sheet, map, data) {
  const leadId = String(data.leadId || '').trim();
  const projectCode = String(data.projectCode || '').trim();
  const status = String(data.status || '').trim();
  const memo = String(data.memo || '').trim().slice(0, 1000);
  const allowedStatuses = ['신규', '연락완료', '상담중', '방문예약', '계약', '보류'];
  const row = findLeadRow(sheet, map, leadId);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found', leadId: leadId });
  if (projectCode && readSheetCell(sheet, row, map, '현장코드') !== projectCode) {
    return jsonResponse({ ok: false, message: 'Lead does not belong to this project' });
  }
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
  const leadRange = sheet.getRange(
    startRow,
    1,
    rowCount,
    sheet.getLastColumn()
  );
  const values = leadRange.getDisplayValues();
  const rawValues = leadRange.getValues();

  const projectCode = String(params.projectCode || '').trim();
  const leads = values.map(function(row, index) {
    return {
      leadId: read(row, map, '접수번호'),
      projectCode: read(row, map, '현장코드'),
      projectName: read(row, map, '현장명'),
      submittedAt: readTimestamp(
        rawValues[index],
        row,
        map,
        '등록일시'
      ),
      name: read(row, map, '이름'),
      phone: read(row, map, '휴대폰'),
      source: read(row, map, '유입경로'),
      medium: read(row, map, '매체유형'),
      campaign: read(row, map, '캠페인'),
      content: read(row, map, '광고소재'),
      term: read(row, map, '검색어'),
      placement: read(row, map, '신청위치'),
      status: read(row, map, '처리상태') || '신규',
      smsStatus: read(row, map, '문자상태'),
      conversionStatus: read(row, map, '광고전환상태'),
      memo: read(row, map, '상담메모')
    };
  }).reverse().filter(function(lead) {
    return !projectCode || lead.projectCode === projectCode;
  });

  return jsonResponse({
    ok: true,
    leads: leads,
    total: projectCode ? leads.length : total,
    updatedAt: new Date().toISOString()
  });
}

function getLeadDetail(data) {
  const leadId = String(data.leadId || '').trim();
  const projectCode = String(data.projectCode || '').trim();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!leadId) return jsonResponse({ ok: false, message: 'leadId is required' });
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ ok: false, message: 'Lead row not found' });
  }

  const map = readHeaderMap(sheet);
  const row = findLeadRow(sheet, map, leadId);
  if (!row) return jsonResponse({ ok: false, message: 'Lead row not found' });
  if (projectCode && readSheetCell(sheet, row, map, '현장코드') !== projectCode) {
    return jsonResponse({ ok: false, message: 'Lead does not belong to this project' });
  }

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

function readTimestamp(rawRow, displayRow, map, header) {
  const column = map[header];
  if (!column) return '';

  const value = rawRow[column - 1];
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(displayRow[column - 1] || '');
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

function putTimestamp(row, map, header, value) {
  const column = map[header];
  if (!column) return;

  const timestamp = parseIsoTimestamp(value);
  row[column - 1] = timestamp || sheetText(value);
}

function setByHeader(sheet, row, map, header, value) {
  const column = map[header];
  if (column) sheet.getRange(row, column).setValue(sheetText(value));
}

function setTimestampByHeader(sheet, row, map, header, value) {
  const column = map[header];
  if (!column) return;

  const timestamp = parseIsoTimestamp(value);
  const range = sheet.getRange(row, column);
  range.setValue(timestamp || sheetText(value));
  if (timestamp) range.setNumberFormat(TIMESTAMP_NUMBER_FORMAT);
}

function parseIsoTimestamp(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const text = String(value == null ? '' : value).trim();
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoPattern.test(text)) return null;

  const timestamp = new Date(text);
  return isNaN(timestamp.getTime()) ? null : timestamp;
}

function formatTimestampCells(sheet, row, map) {
  TIMESTAMP_HEADERS.forEach(function(header) {
    const column = map[header];
    if (column) {
      sheet.getRange(row, column).setNumberFormat(TIMESTAMP_NUMBER_FORMAT);
    }
  });
}

function prepareTimestampColumns(spreadsheet, sheet, map) {
  if (spreadsheet.getSpreadsheetTimeZone() !== KOREAN_TIME_ZONE) {
    spreadsheet.setSpreadsheetTimeZone(KOREAN_TIME_ZONE);
  }

  const propertyKey = [
    'timestamp-migration',
    TIMESTAMP_MIGRATION_VERSION,
    spreadsheet.getId(),
    sheet.getSheetId()
  ].join(':');
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty(propertyKey) === 'done') return;

  const rowCount = sheet.getLastRow() - 1;
  if (rowCount > 0) {
    TIMESTAMP_HEADERS.forEach(function(header) {
      const column = map[header];
      if (!column) return;

      const timestampRange = sheet.getRange(2, column, rowCount, 1);
      const values = timestampRange.getValues();
      const formulas = timestampRange.getFormulas();
      values.forEach(function(row, index) {
        if (formulas[index][0]) return;
        const timestamp = parseIsoTimestamp(row[0]);
        if (!timestamp) return;

        sheet.getRange(index + 2, column)
          .setValue(timestamp)
          .setNumberFormat(TIMESTAMP_NUMBER_FORMAT);
      });
    });
  }

  properties.setProperty(propertyKey, 'done');
}

function sheetText(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
