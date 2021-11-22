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
  });
}
initialize_working_tabs();

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

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

function listTabs() {
  getCurrentWindowTabs().then((tabs) => {
    let tabsList = document.getElementById('list-tabs');
    let currentTabs = document.createDocumentFragment();
    let limit = 50;
    let counter = 0;

    tabsList.textContent = '';

    for(let tab of tabs) {
      if(!tab.active && counter <= limit) {
        let tabLink = document.createElement('a');

        tabLink.textContent = tab.title || tab.id;
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('tab-click');
        tabLink.setAttribute('url', tab.url)
        currentTabs.appendChild(tabLink);
      }
      counter += 1;
    }
    tabsList.appendChild(currentTabs);
    //tabsList.appendChild("<br />");
  });
}

document.addEventListener("DOMContentLoaded", listTabs);

document.addEventListener("click", (e) => {
  if(e.target.classList.contains('tab-click')) {
    var tab_id = e.target.getAttribute('href');
    var tab_url = e.target.getAttribute('url');
    
    working_tabs.push(tab_url);
  }

  e.preventDefault();
});
