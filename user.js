const date = document.getElementById("date");
const agenda = document.getElementById("agenda");
const name_boxes = document.getElementById('name_boxes');

/*google sheets initialization*/
const CLIENT_ID = '627128585914-0pbleafinvi8961jblr8dq7qf6eetnav.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAuyP4bKMSn6qAEtIpEYGjUFi5vxlVrFow';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  loadNames();
  getAgenda();
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
}
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
  };
  colorCells();
  tokenClient.requestAccessToken({prompt: ''});
}
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
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

async function getAgenda() {
  let rowNum = await matchDates('Calendar!A2:A56') + 2;
  const todayAgenda = await getCol('Calendar!D' + rowNum);
  agenda.innerHTML = "Today's Agenda: " + todayAgenda;
}

async function getCol(colRange) {
  cols = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
    range: colRange,
  });
  return cols.result.values;
}

async function matchDates(dateRange) {
  let shell = await getCol(dateRange);
  const posDaysArray = shell[0];

  var today = "Monday, January 6"; //change to getTodaysDate()
  let colNum;
  for(let i = 0; i < posDaysArray.length; i++) {
    if(posDaysArray[i] == today) {
      colNum = i;
    }
  }
  return colNum;
}

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

async function loadNames() {
  const nameArray = await getCol('Attendance!A6:A45');

  for(let i = 0; i < nameArray.length; i += 1){
    let oneName = document.createElement('div');
    const uniqueId = 'person' + i;
    oneName.id = uniqueId;
    oneName.innerHTML = nameArray[i];
    name_boxes.appendChild(oneName);
  }
}

async function colorCells() {
  let colNum = await matchDates('Attendance!B4:BD4') + 2;

  let statusArray = await getCol('Attendance!R6C' + colNum + ':R45C' + colNum);
  for(let i = 0; i < statusArray.length; i++) {
    if(statusArray[i] == 'P') {
      document.getElementById('person' + i).style.background ="green";
    } else if(statusArray[i] == 'A') {
      document.getElementById('person' + i).style.background ="red";
    } else if(statusArray[i] == 'L') {
      document.getElementById('person' + i).style.background ="yellow";
    } else if(statusArray[i] == 'N') {
      document.getElementById('person' + i).style.color ="grey";
      document.getElementById('person' + i).style.borderColor ="grey";
      document.getElementById('person' + i).style.pointerEvents ="none";
    }
  }

  let rowNum;
  name_boxes.addEventListener('click', async function(event) {
    if (event.target !== name_boxes) {
      event.target.style.background = "green";
      rowNum = await matchNames('Attendance!A6:A45', event.target.textContent) + 6;
      const cellRange = 'Attendance!R' + rowNum + 'C' + colNum;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
        range: cellRange,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            ["P"]
          ],
        },
      });
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