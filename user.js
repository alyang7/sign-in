const date = document.getElementById("date");
const agenda = document.getElementById("agenda");
const name_boxes = document.getElementById('name_boxes');

/*google sheets initialization*/
const CLIENT_ID = '627128585914-0pbleafinvi8961jblr8dq7qf6eetnav.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAuyP4bKMSn6qAEtIpEYGjUFi5vxlVrFow';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
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
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  
}


async function loadNames() {
  let response;
  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1WOSzkAosdAdrl_t6gvMJK7QsmFXeyZrBRp6hUtR9C4M',
      range: 'Attendance!A6:A45',
    });
  } catch (err) {
    document.getElementById('name_boxes').innerText = err.message;
    return;
  }

  const nameArray = response.result.values;
  for(let i = 0; i < nameArray.length; i += 1){
    let oneName = document.createElement('div');
    oneName.innerHTML = nameArray[i];
    name_boxes.appendChild(oneName);
  }

  name_boxes.addEventListener('click', function(event) {
    if (event.target !== name_boxes) {
      event.target.style.background = "green";
    }
  });
}

async function listMajors() {
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
}