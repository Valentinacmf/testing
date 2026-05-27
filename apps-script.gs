// Google Apps Script — paste this into Extensions → Apps Script in your Google Sheet.
// Each tester gets ONE row, updated as their events come in.

const HEADERS = [
  'sessionId',
  'firstSeen',
  'lastSeen',
  'pillarsVisited',
  'visitsA', 'visitsB', 'visitsC', 'visitsD', 'visitsE', 'visitsF',
  'timeA_s', 'timeB_s', 'timeC_s', 'timeD_s', 'timeE_s', 'timeF_s',
  'chosenPillar',
  'reason',
  'totalClicks',
  'userAgent',
];

const COL = {};
HEADERS.forEach((h, i) => { COL[h] = i; });

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    const sessionId = data.sessionId;
    if (!sessionId) {
      return jsonOut({ ok: false, error: 'missing sessionId' });
    }

    const lastRow = sheet.getLastRow();
    let rowIndex = -1;
    if (lastRow > 1) {
      const sessionColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < sessionColumn.length; i++) {
        if (sessionColumn[i][0] === sessionId) {
          rowIndex = i + 2;
          break;
        }
      }
    }

    let row;
    if (rowIndex === -1) {
      row = new Array(HEADERS.length).fill('');
      row[COL.sessionId] = sessionId;
      row[COL.firstSeen] = new Date(data.timestamp);
      ['visitsA','visitsB','visitsC','visitsD','visitsE','visitsF',
       'timeA_s','timeB_s','timeC_s','timeD_s','timeE_s','timeF_s',
       'totalClicks'].forEach(k => { row[COL[k]] = 0; });
      row[COL.userAgent] = data.userAgent || '';
      rowIndex = lastRow === 0 ? 2 : lastRow + 1;
    } else {
      row = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
    }

    row[COL.lastSeen] = new Date(data.timestamp);

    let pillarLetter = '';
    if (data.page && /^pillar-[a-f]\.html$/i.test(data.page)) {
      pillarLetter = data.page.match(/pillar-([a-f])\.html/i)[1].toUpperCase();
    }

    if (data.type === 'pageview' && pillarLetter) {
      row[COL['visits' + pillarLetter]] = (row[COL['visits' + pillarLetter]] || 0) + 1;
      const visited = (row[COL.pillarsVisited] || '').toString().split(',').filter(Boolean);
      if (!visited.includes(pillarLetter)) {
        visited.push(pillarLetter);
        row[COL.pillarsVisited] = visited.join(',');
      }
    } else if (data.type === 'click') {
      row[COL.totalClicks] = (row[COL.totalClicks] || 0) + 1;
    } else if (data.type === 'pageexit' && pillarLetter && data.timeOnPageMs) {
      const key = 'time' + pillarLetter + '_s';
      row[COL[key]] = (row[COL[key]] || 0) + Math.round(data.timeOnPageMs / 1000);
    } else if (data.type === 'thank_you_view' && data.chosenPillar) {
      row[COL.chosenPillar] = data.chosenPillar;
    } else if (data.type === 'survey_response') {
      if (data.responseText) row[COL.reason] = data.responseText;
      if (data.chosenPillar && !row[COL.chosenPillar]) row[COL.chosenPillar] = data.chosenPillar;
    }

    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Pillar test tracker — POST events here.');
}
