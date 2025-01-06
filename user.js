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
  tokenClient.requestAccessToken({prompt: ''});
  colorCells();
  for (const child of name_boxes.children) {
    child.addEventListener("mouseover", function() {
      this.style.cursor = "pointer";
    });
  }
  document.getElementById('signout_button').style.visibility = 'visible';
  openPopup();
}
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
  }
  openPopup();
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

  let colNum = await matchDates('Attendance!B4:BD4') + 2;
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

  let rowNum = await matchDates('Calendar!A2:A56') + 2;
  let startArray = await getCol('Calendar!B' + rowNum);
  potentialStart = startArray[0] + "";
  areYouLate();
}

function compareTimes(time1, time2) {
  const [uselessNum, newTime] = time1.split("0");
  const [h1, m1, s1] = newTime.split(":");
  const [h2, m2, s2] = time2.split(":");

  if (h1 < h2) return -1;
  if (h1 > h2) return 1;
  if (m1 < m2) return -1;
  if (m1 > m2) return 1;
  if (s1 < s2) return -1;
  if (s1 > s2) return 1;
  return 0; // times are equal
}

let intervalId;
const areYouLate = async () => {
  let now = new Date();
  let currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

async function colorCells() {
  let colNum = await matchDates('Attendance!B4:BD4') + 2;
  let rowNum;
  //setInterval(await areYouLate(), 1000);

  name_boxes.addEventListener('click', async function(event) {
    if (event.target !== name_boxes) {
      event.target.style.background = "#3CB043";
      rowNum = await matchNames('Attendance!A6:A45', event.target.textContent) + 6;
      const cellRange = 'Attendance!R' + rowNum + 'C' + colNum;
      if(lateStatus == true) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
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