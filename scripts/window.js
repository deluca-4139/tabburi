"use strict";

// These buttons might require CSS modules at some point?
// Not sure; they seem to function fine as they are now.
var clearDataButton = document.querySelector('.clearData');
var openButton = document.querySelector('.open');
var saveButton = document.querySelector('.save');
var deleteButton = document.querySelector('.delete');
var wizardButton = document.querySelector('.profileWizard');

clearDataButton.addEventListener('click', clearData);
openButton.addEventListener('click', openTabs);
saveButton.addEventListener('click', saveProfile);
deleteButton.addEventListener('click', deleteConfirm);
wizardButton.addEventListener('click', openWizard);

var profile_dict = {}; // Will probably have to use an initialization function to load previously stored tabs eventually
var working_tabs = [];

document.getElementById('tab-profiles').onchange = profileSelect; // Couldn't get this to work in the HTML for some reason so we're setting it here

// Grab local storage to initialize the working tab array.
// Runs the companion function listWorkingTabs() upon completion
// of Promise as that function requires storage to be loaded
// in order for it to run successfully.
// TODO: be sure to toggle off the keepUuidOnUninstall and
// keepStorageOnUninstall in about:config when done testing.
function initializeWorkingTabs() {
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

// Grab local storage to initialize profile storage.
function initializeProfiles() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    for(let dict in results) {
      if(dict != "working" && dict != "env") {
        profile_dict[dict] = results[dict];
      }
    }
    console.log("Profiles initialized successfully.");
  });
}

// Initialize the environment variables.
// This is a dictionary that contains:
// current: currently active profile
// switching: whether or not the extension is currently switching to a new profile/window
//    if true, the extension has not yet completed the process of opening a new window (see background.js)
//    if false, background.js has successfully caught the opening of the new window and reverted this value to false.
// window: contains window id of window that opens the profile
// wizard: contains a tuple where
//    [0] is a boolean representing whether the wizard is open or not, and
//    [1] is the window id of the wizard, or -1 if it is not open
//
// This function also initializes the welcome
// message depending on whether or not the
// extension had been initialized before.
function initializeEnv() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    if(results["env"]) {
      document.getElementById('welcome').textContent = "たっぶり　へ　おかえり。";
    }
    else {
      document.getElementById('welcome').textContent = "たっぶり　へ　ようこそ。";

      console.log("env vars not detected. Creating...");
      var envDict = { "current": "Default", "switching": false, "window": -1, "wizard": [false, -1] }; // update with other env var init values as needed
      browser.storage.local.set({ "env": envDict });
    }
  });
}

// Create default profile.
// Default profile contains all active tabs upon first launch of the extension.
// More documentation needed...
// TODO: do not allow user to create a profile that overwrites default
// TODO: warn user upon deletion of default profile
function createDefaultProfile() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    if(results["Default"]) {
      return null; // what do I want to do here?
    }
    else {
      console.log("Default profile not detected. Creating...");
      getCurrentWindowTabs().then((tabs) => {
        var storing = browser.storage.local.set({ "Default": tabs });
        storing.then(() => {
          initializeProfiles();
          updateProfiles();
        });
      });
    }
  });
}

// On button click functions.
// TODO: document
function clearData() {
  var clearData = browser.storage.local.clear(); // if I keep this button around, will probably want to warn before clearing all data
  clearData.then(() => {
    console.log("Your saved data has been cleared.");
  });
}

function openTabs() {
  var profile = profile_dict[document.getElementById('tab-profiles').value];
  var tabArr = [];
  var currentWindow = browser.windows.getCurrent();
  currentWindow.then((cW) => {
    for(let tab in profile) {
      tabArr.push(profile[tab]);
    }
    var parsedTabArr = [];
    // Mandatory parsing to make sure browser.windows.create doesn't throw a
    // malformed URL exception when attempting to create a privileged URL tab
    for(let tab in tabArr) {
      try {
        let urlTest = new URL(tabArr[tab]["url"]);
        if(urlTest.protocol === "http:" || urlTest.protocol === "https:") {
          parsedTabArr.push(tabArr[tab]);
        }
      }
      catch {}
    }
    let createData = {
      state: "maximized",
      url: parsedTabArr[0]["url"] // First tab in new window is first tab in list
    };
    var envDict = browser.storage.local.get(null);
    envDict.then((results) => {
      results["env"]["current"] = document.getElementById('tab-profiles').value;
      results["env"]["switching"] = true;
      results["env"]["window"] = cW["id"];
      var storing = browser.storage.local.set({ "env": results["env"] });
      storing.then(() => {
        console.log("Handing off control to background script...");
        browser.windows.create(createData);
      });
    });
  });
}

function saveProfile() {
  var textBox = document.getElementById('profile-name');
  var storing = browser.storage.local.set({ [textBox.value]: working_tabs });
  storing.then(() => {
    initializeProfiles();
    updateProfiles();
  });
  console.log("Profile saved.");
}

// First called by button to confirm deletion of profile.
// Swaps event listeners to actual delete function and
// edits text to confirm deletion of profile with user.
function deleteConfirm() {
  document.getElementById('delete-button').innerText = "Are you sure?";
  deleteButton.removeEventListener('click', deleteConfirm)
  deleteButton.addEventListener('click', deleteProfile);
}

// Actual delete function.
// Swaps event listeners back and edits text upon completion of delete.
function deleteProfile() {
  var profileName = document.getElementById('tab-profiles').value;
  delete profile_dict[profileName];
  browser.storage.local.clear(); // This maybe isn't best practice... could lose all data if something goes wrong
  for(let profile in profile_dict) {
    browser.storage.local.set({ [profile]: profile_dict[profile] });
  }
  browser.storage.local.set({ working: working_tabs }); // Might not need in the future?

  document.getElementById('delete-button').innerText = "Delete Profile";
  deleteButton.removeEventListener('click', deleteProfile);
  deleteButton.addEventListener('click', deleteConfirm);

  console.log("Profile deleted.")
  updateProfiles();
  listWorkingTabs();
}

function openWizard() {
  let createData = {
    type: "panel",
    url: "../htmls/popup.html",
    height: 800,
    width: 1200
  };

  browser.storage.local.get(null).then((results) => {
    results["env"]["wizard"] = [true, -1]
    browser.storage.local.set({ "env": results["env"] }).then(() => {
      browser.windows.create(createData).then((window, error) => {
        results["env"]["wizard"] = [true, window.id];
        browser.storage.local.set({ "env": results["env"] }).then(() => {
          console.log("Wizard opened.");
        });
      });
    });
  });
}

// Update working tabs (and list) when profile is selected.
// TODO: doesn't work if only one profile exists. Might not need
// to worry about this if we have a "default" profile in the future
function profileSelect() {
  var profileName = document.getElementById('tab-profiles').value;
  working_tabs = profile_dict[profileName];
  listWorkingTabs();
}

// Helper function
function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

// List working tabs for creation of profiles.
function listWorkingTabs() {
  let workingTabsList = document.getElementById('working-tabs');
  let bufTabs = document.createDocumentFragment();
  bufTabs.textContent = "Tabs in currently selected profile: ";
  bufTabs.appendChild(document.createElement('br'));
  bufTabs.appendChild(document.createElement('br'));

  for(let tab of working_tabs) {
    let tabCheckbox = document.createElement('input');
    let tabLabel = document.createElement('label');
    let maxLinkLength = 45;

    if(tab.title) {
      if(tab.title.length < maxLinkLength) {
        tabLabel.textContent = tab.title;
      }
      else {
        tabLabel.textContent = tab.title.substring(0, maxLinkLength) + "..."
      }
    }
    else {
      tabLabel.textContent = tab.id;
    }

    tabLabel.setAttribute('for', `${tab.id}`);

    let tabImage = document.createElement('img');
    tabImage.setAttribute('id', `${tab.id}`);
    tabImage.setAttribute('src', tab.favIconUrl);

    bufTabs.appendChild(tabImage);
    bufTabs.appendChild(tabLabel);
    bufTabs.appendChild(document.createElement('br'));
  }
  workingTabsList.replaceChildren(bufTabs); // Required so working tabs list auto-updates on click in HTML
}

// Update drop-down list of profiles on main HTML display.
// Called on creation of new profiles by user
// in order to keep display up to date.
// TODO: update to use already-stored profile_dict instead of regrabbing local storage?
function updateProfiles() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    var keys = Object.keys(results);
    var dropdownMenu = document.getElementById('tab-profiles'); // HTMLOptionElement for the drop-down menu
    let bufMenu = document.createDocumentFragment();
    var profile, buf; // Working variables for usage with HTML elements

    // Loop through all keys to add profiles to drop-down menu
    for(let key of keys) {
      if(key != "working" && key != "env") { // We don't want to add the working tabs/env-vars as a profile
        profile = document.createElement('option');
        profile.value = key;
        profile.text = key;
        bufMenu.appendChild(profile);
      }
    }
    dropdownMenu.replaceChildren(bufMenu);
  });
}

// Run init functions on load
document.addEventListener("DOMContentLoaded", initializeWorkingTabs);
document.addEventListener("DOMContentLoaded", createDefaultProfile);
document.addEventListener("DOMContentLoaded", updateProfiles);
document.addEventListener("DOMContentLoaded", initializeProfiles);
document.addEventListener("DOMContentLoaded", initializeEnv);

document.addEventListener("click", (e) => {
  if(e.target.classList.contains('tab-click')) {
    var tab_title = e.target.getAttribute('title');
    var tab_id = e.target.getAttribute('href');
    var tab_url = e.target.getAttribute('url');
    var tab_favicon = e.target.getAttribute('favIconUrl');

    working_tabs.push({ title: tab_title, url: tab_url, id: tab_id, favIconUrl: tab_favicon });
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
