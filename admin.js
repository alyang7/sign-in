/* Toggle between adding and removing the "responsive" class to topnav when the user clicks on the icon */
function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}
function makeCollapsible() {
  var coll = document.getElementsByClassName("collapsible");
  var i;

  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  }
}

const container = document.getElementById('container');
const title = document.getElementById('title');

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
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
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

  return today;
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

  var today = getTodaysDate(); //"Monday, January 6"; //change to getTodaysDate()
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


function homeReset() {
  container.innerHTML = "Don't double click a tab. Be patient as it takes a few seconds to load. Click the tab again to refresh";
  title.innerHTML = "Admin Center";
  document.getElementById("txt-search").style.visibility = 'hidden';
  document.getElementById("search").style.visibility = 'hidden';
}

async function getStatus(letter, type) {
  title.innerHTML = "Cast Members Who Are " + type;
  document.getElementById("txt-search").style.visibility = 'hidden';
  document.getElementById("search").style.visibility = 'hidden';
  let html = '';
  let colNum = await matchDates('Attendance!B4:BD4') + 2;
  let statusArray = await getCol('Attendance!R6C' + colNum + ':R46C' + colNum);
  for(let i = 0; i < statusArray.length; i++) {
    if(statusArray[i] == letter) {
      let nameRow = i + 3;
      let personData = await getCol("Info Sheet!A" + nameRow + ":F" + nameRow);
      html += '<div class="collapsible">' + personData[0][0] + '</div>';
      html += '<div class="content">';
      html += '<p>' + personData[0][1] + '</p>';
      html += '<p>' + personData[0][5] + '</p>';
      html += '<p>' + '<a href="mailto:' + personData[0][3] + '">' + personData[0][3] + '\n' + '</a>' + '</p>';
      html += '<p>' + '<a href="tel:' + personData[0][4] + '">' + personData[0][4] + '\n' + '</a>' + '</p>';
      html += '</div>';
    }
  }

  container.innerHTML = html;
  makeCollapsible();
}

//MAKE ALL ITEMS IN LIST COPYABLE
async function displaySearch() {
  title.innerHTML = "Search Cast Info Sheet";
  document.getElementById("txt-search").style.visibility = 'visible';
  document.getElementById("search").style.visibility = 'visible';

  let html = '';
  const castInfo = await getCol('Info Sheet!A3:F42');
  for(let i = 0; i < castInfo.length; i++) {
    html += '<div class="collapsible">' + castInfo[i][0] + '</div>';
    html += '<div class="content">';
    html += '<p>' + castInfo[i][1] + '</p>';
    html += '<p>' + castInfo[i][5] + '</p>';
    html += '<p>' + '<a href="mailto:' + castInfo[i][3] + '">' + castInfo[i][3] + '\n' + '</a>' + '</p>';
    html += '<p>' + '<a href="tel:' + castInfo[i][4] + '">' + castInfo[i][4] + '\n' + '</a>' + '</p>';
    html += '</div>';
  }

  container.innerHTML = html;
  makeCollapsible();

  
  document.getElementById("search").addEventListener("click", function(){
    let foundInfo = [];
    let searchedhtml = '';
    const searchTerm = document.getElementById("txt-search").value.toLowerCase();
    for (let i = 0; i < castInfo.length; i++) {
      castInfo[i] = castInfo[i].map(lowerInfo => lowerInfo.toLowerCase());
      if (castInfo[i].some(element => element.includes(searchTerm))) {
        foundInfo.push(castInfo[i]);
      }
    }
    for(let k = 0; k < foundInfo.length; k++) {
      searchedhtml += '<div class="collapsible">' + foundInfo[k][0] + '</div>';
      searchedhtml += '<div class="content">';
      searchedhtml += '<p>' + foundInfo[k][1] + '</p>';
      searchedhtml += '<p>' + foundInfo[k][5] + '</p>';
      searchedhtml += '<p>' + '<a href="mailto:' + foundInfo[k][3] + '">' + foundInfo[k][3] + '\n' + '</a>' + '</p>';
      searchedhtml += '<p>' + '<a href="tel:' + foundInfo[k][4] + '">' + foundInfo[k][4] + '\n' + '</a>' + '</p>';
      searchedhtml += '</div>';
    }
    container.innerHTML = searchedhtml;
    makeCollapsible();
  });
}

function displayEmergency() {
  let html = '';
  html += '<div class="contacts">' + '<a href="tel:9132204565">Aldric</a>' + '</div>';
  container.innerHTML = html;
}

function displayTimer() {
  title.innerHTML = "Timer - not working yet";
  let html = '';
  html += '<button></button>';
  html += '<div></div>';
  container.innerHTML = html;
  //display 4 buttons + 1 container div
  //sync to google
  //onclick -> write time, display "reh started"
  //onclick -> popup option of timer, start timer, write time, display timer
  //onclick -> write time, display "reh ended"
}