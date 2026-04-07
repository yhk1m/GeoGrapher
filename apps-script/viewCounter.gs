// Google Apps Script - GeoGrapher 뷰 카운터
// 스프레드시트에 "ViewCount" 시트 필요
// A1: "total", B1: 총 방문수
// A2~: 날짜(YYYY-MM-DD), B2~: 해당 날짜 방문수

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ViewCount");

  if (!sheet) {
    sheet = ss.insertSheet("ViewCount");
    sheet.getRange("A1").setValue("total");
    sheet.getRange("B1").setValue(0);
  }

  // 총 방문수 증가
  var totalCell = sheet.getRange("B1");
  var total = (totalCell.getValue() || 0) + 1;
  totalCell.setValue(total);

  // 오늘 날짜
  var today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");

  // 오늘 날짜 행 찾기
  var data = sheet.getDataRange().getValues();
  var todayRow = -1;
  for (var i = 1; i < data.length; i++) {
    var dateVal = data[i][0];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, "Asia/Seoul", "yyyy-MM-dd");
    }
    if (dateVal === today) {
      todayRow = i + 1; // 1-indexed
      break;
    }
  }

  var todayCount;
  if (todayRow > 0) {
    var cell = sheet.getRange("B" + todayRow);
    todayCount = (cell.getValue() || 0) + 1;
    cell.setValue(todayCount);
  } else {
    // 새 날짜 행 추가
    var newRow = sheet.getLastRow() + 1;
    sheet.getRange("A" + newRow).setValue(today);
    sheet.getRange("B" + newRow).setValue(1);
    todayCount = 1;
  }

  var result = {
    today: todayCount,
    total: total
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
