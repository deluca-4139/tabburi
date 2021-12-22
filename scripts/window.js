// These buttons might require CSS modules at some point?
// Not sure; they seem to function fine as they are now.
var storeButton = document.querySelector('.store');
var openButton = document.querySelector('.open');
var clearButton = document.querySelector('.clear');

storeButton.addEventListener('click', storeTabs);
openButton.addEventListener('click', openTabs);
clearButton.addEventListener('click', clearTabs);

var tab_dict = {}; // Will probably have to use an initialization function to load previously stored tabs eventually
var working_tabs = [];

// Grab local storage to initialize the working tab array.
// Runs the companion function listWorkingTabs() upon completion
// of Promise as that function requires storage to be loaded
// in order for it to run successfully.
// TODO: be sure to toggle off the keepUuidOnUninstall and
// keepStorageOnUninstall in about:config when done testing.
function initialize_working_tabs() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    if(results["working"]) {
      for(var buf of results["working"]) {
          working_tabs.push(buf);
      }
      console.log("Working tabs initialized successfully.");
    }
    else {
      console.log("Working tabs not yet saved; skipping initialization...");
    }
    listWorkingTabs();
  });
}

function storeTabs() {
  var storing = browser.storage.local.set({ working: working_tabs });
  console.log("Your working tabs have been stored.");
}

function openTabs() {
  console.log(working_tabs);
}

function clearTabs() {
  browser.storage.local.clear();
  working_tabs = []; // Do I really want this?
  console.log("Stored working tabs have been cleared.");
}

// Helper function
function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

// List tabs from current active window. Hyperlinks contain href, url, and title information.
function listTabs() {
  getCurrentWindowTabs().then((tabs) => {
    let tabsList = document.getElementById('list-tabs');
    let limit = 50;
    let counter = 0;

    for(let tab of tabs) {
      if(!tab.active && counter <= limit) {
        let tabLink = document.createElement('a');

        tabLink.textContent = tab.title || tab.id;
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('tab-click');
        tabLink.setAttribute('url', tab.url);
        tabLink.setAttribute('title', tab.title);
        tabsList.appendChild(tabLink);
        tabsList.appendChild(document.createElement('br'));
      }
      counter += 1;
    }
  });
}

// List working tabs for creation of profiles.
function listWorkingTabs() {
  let workingTabsList = document.getElementById('working-tabs');
  let bufTabs = document.createDocumentFragment();
  bufTabs.textContent = "Working tabs: "
  bufTabs.appendChild(document.createElement('br'));

  for(let tab of working_tabs) {
    let tabLink = document.createElement('a');

    tabLink.textContent = tab.title;
    tabLink.setAttribute('href', tab.id);
    tabLink.classList.add('tab-remove');
    tabLink.setAttribute('url', tab.url);
    bufTabs.appendChild(tabLink);
    bufTabs.appendChild(document.createElement('br'));
  }
  workingTabsList.replaceChildren(bufTabs); // Required so working tabs list auto-updates on click in HTML
}

// Update drop-down list of profiles on main HTML display.
// Will probably be called on creation of new profiles by user
// in order to keep display up to date.
function updateProfiles() {
  var getStorage = browser.storage.local.get(null)
  getStorage.then((results) => {
    var keys = Object.keys(results);
    var dropdownMenu = document.getElementById('tab-profiles'); // HTMLOptionElement for the drop-down menu
    var profile, buf; // Working variables for usage with HTML elements
    //console.log("Parent element: ");
    //console.log(dropdownMenu)

    // Loop through all keys to add profiles to drop-down menu
    for(let key of keys) {
      if(key != "working") { // We don't want to add the working tabs as a profile
        profile = document.createElement('option');
        buf = dropdownMenu.appendChild(profile);
        buf.value = key;
        buf.text = key;
      }
    }
  });
}

// Run init functions on load
document.addEventListener("DOMContentLoaded", initialize_working_tabs);
document.addEventListener("DOMContentLoaded", listTabs);
document.addEventListener("DOMContentLoaded", updateProfiles);

document.addEventListener("click", (e) => {
  if(e.target.classList.contains('tab-click')) {
    var tab_title = e.target.getAttribute('title');
    var tab_id = e.target.getAttribute('href');
    var tab_url = e.target.getAttribute('url');

    working_tabs.push({ title: tab_title, url: tab_url, id: tab_id });
    listWorkingTabs();
  }

  if(e.target.classList.contains('tab-remove')) {
    var bufArray = working_tabs.filter((item) => item.url !== e.target.getAttribute('url'));
    working_tabs = bufArray;
    console.log("Tab removed.");
    listWorkingTabs();
  }

  e.preventDefault();
});
