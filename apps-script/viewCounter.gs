// Google Apps Script - GeoGrapher 뷰 카운터
// 스프레드시트에 "ViewCount" 시트 필요
// A1: "total", B1: 총 방문수
// A2~: 날짜(텍스트 YYYY-MM-DD), B2~: 해당 날짜 방문수

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
  var total = (Number(totalCell.getValue()) || 0) + 1;
  totalCell.setValue(total);

  // 오늘 날짜 (텍스트)
  var today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");

  // 오늘 날짜 행 찾기 (A열 전체를 텍스트로 비교)
  var lastRow = sheet.getLastRow();
  var todayRow = -1;

  if (lastRow >= 2) {
    var dates = sheet.getRange("A2:A" + lastRow).getDisplayValues(); // 화면에 보이는 텍스트로 가져옴
    for (var i = 0; i < dates.length; i++) {
      if (dates[i][0] === today) {
        todayRow = i + 2; // 시트는 1-indexed, A2부터 시작
        break;
      }
    }
  }

  var todayCount;
  if (todayRow > 0) {
    // 기존 행 업데이트
    var cell = sheet.getRange("B" + todayRow);
    todayCount = (Number(cell.getValue()) || 0) + 1;
    cell.setValue(todayCount);
  } else {
    // 새 날짜 행 추가 (텍스트로 저장하여 형식 문제 방지)
    var newRow = lastRow + 1;
    sheet.getRange("A" + newRow).setNumberFormat("@").setValue(today);
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
