const {
	google
} = require("googleapis");

const spreadsheetId = "1X-503RbzfMhGhNoyyNe_Vu4R0c-c03r249YobxZ6OPM";
const totalSickDays = 5;
const totalVacationDays = 20;

async function getAllData(realName, auth) {
	const sheets = google.sheets({
		version: "v4",
		auth
	});
	const data = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: "2020 Staff Vacations!A5:F16"
	});
	return data;
}

async function getRow(realName, auth) {
	const allData = await getAllData(realName, auth);
	const row = allData.data.values.filter(arr => arr[0].includes(realName));
	return row.flat();
}

async function getSickDays(username, auth) {
	const row = await getRow(username, auth);
	return totalSickDays - row[5]
}

async function getVacationDays(username, auth) {
	const row = await getRow(username, auth);
	return totalVacationDays - row[4]
}

function columnToLetter(column)
{
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

async function setSickOrVacation({ spreadSheetTab, username, sickOrVacation, auth } = {}) {
  const [day, month, date, year] = new Date().toDateString().split(' ');
  const sheets = google.sheets({ version: 'v4', auth });
  let userRow, dateColumn;
  const customRange = spreadSheetTab ? spreadSheetTab : month;

  const userRows = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${customRange}!A1:A`, // selects full column
  });
  userRows.data.values.forEach((row, i) => {
    if (row[0] === username) {
      userRow = i + 1;
    }
  });

  const dateColumns = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${customRange}!2:2`, // selects full row
  });
  dateColumns.data.values[0].forEach((column, i) => {
    if (column === date) {
      dateColumn = columnToLetter(i+1);
    }
  });

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `${customRange}!${dateColumn + userRow}`, // selects targeted cell
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[sickOrVacation]] },
  });
}

module.exports = {
	getSickDays,
	getVacationDays,
	setSickOrVacation
}
