/*TODO: 
get as input: client_id, api_key, spreadsheetID
attendance column and row, calendar column, info sheet column*/

const date = document.getElementById("date");
const agenda = document.getElementById("agenda");
const name_boxes = document.getElementById('name_boxes');
let lateStatus = false;
let potentialStart;

function openPopup() {
  const popDialog = document.getElementById("signinPopUp");
  popDialog.style.visibility =
      popDialog.style.visibility ===
          "hidden"
          ? "visible"
          : "hidden";
}

/*google sheets initialization*/
const CLIENT_ID = '627128585914-2khuh7u0pp39r6uuvporu41mps56tgk7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAdUWiOLG6kacbxMiyrH1zRAdDD4VfkJ20';
const SPREADSHEET_ID = '1xwaFbean5QBkc6xcDip2o-SdgOyVA5KX4rRebsagiAY';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
let tokenClient;
let gapiInited = false;
let gisInited = false;

//Loads all google sheets api stuff
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;  
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
}

//handles Google sign-in for editing spreadsheet
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
  };  
  tokenClient.requestAccessToken({prompt: ''}); 
  
  document.getElementById('load_button').style.visibility = 'visible';
  document.getElementById('signout_button').style.visibility = 'visible';
  openPopup();
}
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('signout_button').style.visibility = 'hidden';
  }
  openPopup();
}

function loadFunctions() {
  loadNames();
  getAgenda();
  colorCells();
  for (const child of name_boxes.children) {
    child.addEventListener("mouseover", function() {
      this.style.cursor = "pointer";
    });
  }
  document.getElementById('load_button').style.visibility = 'hidden';
}


async function getMaxRow(sheetName) {
  try {
    const range = `${sheetName}!A:A`;

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const values = response.result.values;

    if (!values || values.length === 0) {
      console.log('No data found.');
      return 0;
    }

    // Iterate through the flattened array of values
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0]; 
      if (cellValue && cellValue.includes('-')) {
        return i; 
      }
    }

    console.log('No dash found in the specified range.');
    return values.length; // Return the total number of rows if no dash is found

  } catch (err) {
    console.error('The API returned an error: ' + err);
    return -1;
  }
}

async function getMaxCol(sheetName) {
  try {
    const range = `${sheetName}!2:2`;

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const values = response.result.values;
    if (!values || values.length === 0) {
      console.log('No data found.');
      return 0;
    }

    // Iterate through the flattened array of values and convert to letters
    column = values[0].length - 1;
    let temp, letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;

  } catch (err) {
    console.error('The API returned an error: ' + err);
    return -1;
  }
}

window.onload = getTodaysDate();
function getTodaysDate() {
  var objToday = new Date(),
	  weekday = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
	  dayOfWeek = weekday[objToday.getDay()],
	  dayOfMonth = objToday.getDate(),
	  months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
	  curMonth = months[objToday.getMonth()];
  var today = dayOfWeek + ", " + curMonth + " " + dayOfMonth;

  date.innerHTML = today;
  return today;
}

//matches current date to the agenda in the Calendar tab
async function getAgenda() {
  const maxCalendarRow = await getMaxRow("Calendar");
  let rowNum = await matchDates('Calendar!A2:A' + maxCalendarRow) + 2;
  const todayAgenda = await getCol('Calendar!D' + rowNum);
  agenda.innerHTML = "Today's Agenda: " + todayAgenda;
}

//get all data for a specific column
async function getCol(colRange) {
  cols = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: colRange,
  });
  return cols.result.values;
}

//get info for current day from the Calendar tab
async function matchDates(dateRange) {
  let posDaysArray = await getCol(dateRange);
  var today = getTodaysDate(); 
  let colNum;
  for(let i = 0; i < posDaysArray.length; i++) {
    if(posDaysArray[i] == today) {
      colNum = i;
    }
  }
  return colNum;
}

//get the current day from the Attendance tab
async function horizontalDates(dateRange) {
  let colNum;
  const maxAttendanceCol = await getMaxCol("Attendance");
  let shell = await getCol('Attendance!B4:' + maxAttendanceCol + '4');
  const posDaysArray = shell[0];
  var today = getTodaysDate();
  for(let i = 0; i < posDaysArray.length; i++) {
    if(posDaysArray[i] == today) {
      colNum = i;
    }
  }
  return colNum;
}

//makes colorCells() more readable
async function matchNames(dateRange, searchedName) {
  let posNamesArray = await getCol(dateRange);
  let rowNum;
  for(let i = 0; i < posNamesArray.length; i++) {
    if(posNamesArray[i] == searchedName) {
      rowNum = i;
    }
  }
  return rowNum;
}

//populates name boxes and colors
async function loadNames() {
  const maxAttendanceCol = await getMaxCol("Attendance");
  const maxAttendanceRow = await getMaxRow("Attendance");
  const maxCalendarRow = await getMaxRow("Calendar");

  const nameArray = await getCol('Attendance!A6:A' + maxAttendanceRow);

  for(let i = 0; i < nameArray.length; i += 1){
    let oneName = document.createElement('div');
    const uniqueId = 'person' + i;
    oneName.id = uniqueId;
    oneName.innerHTML = nameArray[i];
    name_boxes.appendChild(oneName);
  }

  let colNum = await horizontalDates('Attendance!B4:'+ maxAttendanceCol + '4') + 2;
  let statusArray = await getCol('Attendance!R6C' + colNum + ':R45C' + colNum);
  for(let i = 0; i < statusArray.length; i++) {
    if(statusArray[i] == 'P') {
      document.getElementById('person' + i).style.background ="#3CB043";
      document.getElementById('person' + i).style.pointerEvents ="none";
    } else if(statusArray[i] == 'A') {
      document.getElementById('person' + i).style.background ="#E3242B";
      document.getElementById('person' + i).style.pointerEvents ="none";
    } else if(statusArray[i] == 'L') {
      document.getElementById('person' + i).style.background ="yellow";
      document.getElementById('person' + i).style.pointerEvents ="none";
    } else if(statusArray[i] == 'N' || statusArray[i] == 'N (a)') {
      document.getElementById('person' + i).style.color ="grey";
      document.getElementById('person' + i).style.borderColor ="grey";
      document.getElementById('person' + i).style.pointerEvents ="none";
    }
  }

  let rowNum = await matchDates('Calendar!A2:A' + maxCalendarRow) + 2;
  let startArray = await getCol('Calendar!B' + rowNum);
  potentialStart = startArray[0] + "";
  areYouLate();
}

//used to check for tardy
function compareTimes(time1, time2) {
  const [h1, m1, s1] = time1.split(":");
  const [h2, m2, s2] = time2.split(":");
  if (parseInt(h1) < parseInt(h2)) return -1;
  if (parseInt(h1) > parseInt(h2)) return 1;
  if (parseInt(m1) < parseInt(m2)) return -1;
  if (parseInt(m1) > parseInt(m2)) return 1;
  if (parseInt(s1) < parseInt(s2)) return -1;
  if (parseInt(s1) > parseInt(s2)) return 1;
  return 0; // times are equal
}

//checks for tardy
let intervalId;
const areYouLate = async () => {
  let now = new Date();
  let currentTime = now.toLocaleTimeString('en-US', { hour12: false });
  if(compareTimes(currentTime, potentialStart) > 0) {
    lateStatus = true;
    document.getElementById("clock").style.color = "red";
    for (const child of name_boxes.children) {
      child.style.border = '2px solid red';
    }
  } else {
    
    lateStatus = false;
  }

  // Schedule the next execution
  intervalId = setTimeout(areYouLate, 1000); 
};

//fills in google spreadsheet when actor signs in (Attendance tab)
async function colorCells() {
  const maxAttendanceCol = await getMaxCol("Attendance");
  const maxAttendanceRow = await getMaxRow("Attendance");
  let colNum = await horizontalDates('Attendance!B4:' + maxAttendanceCol + '4') + 2;
  let rowNum;

  name_boxes.addEventListener('click', async function(event) {
    if (event.target !== name_boxes) {
      event.target.style.background = "#3CB043";
      rowNum = await matchNames('Attendance!A6:A' + maxAttendanceRow, event.target.textContent) + 6;
      const cellRange = 'Attendance!R' + rowNum + 'C' + colNum;
      if(lateStatus == true) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: cellRange,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              ["*L*"]
            ],
          },
        });
      } else {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: cellRange,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              ["P"]
            ],
          },
        });
      } 
    }
  });
}

/*async function listMajors() {
  let response;
  try {
    // Fetch first 10 files
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
      range: 'Attendance!A6:A45',
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    document.getElementById('content').innerText = 'No values found.';
    return;
  }
  // Flatten to string to display
  const output = range.values.reduce(
      (str, row) => `${str}${row[0]}\n`, '');
  document.getElementById('content').innerText = output;

  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
    range: "Info Sheet!A:B",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [
        ["name", "number"]
      ],
    },
  });
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
    range: 'Info Sheet!A51',
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [
        ["P"]
      ],
    },
  });
}*/

/*async function areYouLate() {
  let rowNum = await matchDates('Calendar!A2:A56') + 2;
  let startArray = await getCol('Calendar!B' + rowNum);
  let potentialStart = startArray[0];
  console.log(potentialStart);
  let now = new Date();
  let currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(currentTime);
  if(currentTime > potentialStart) {
    lateStatus = true;
    document.getElementById("clock").style.color = "red";
    const childDivs = name_boxes.children;
    childDivs.forEach(div => {
      // Change the border style
      div.style.border = '2px solid red';
    });
  } else {
    lateStatus = false;
  }
}*/