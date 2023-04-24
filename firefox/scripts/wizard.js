"use strict";

var submitTabsButton = document.querySelector('.submitTabs');

submitTabsButton.addEventListener('click', submitTabs);

var profile_dict = {};
var toTabs = [];
var fromTabs = null;

document.getElementById('tab-profiles-left').onchange = fromProfileSelect;
document.getElementById('tab-profiles-right').onchange = toProfileSelect;

function loadDefault() {
  // Load the default profile if this is the first time
  // we're running the function; i.e. the window has
  // just been opened
  if(fromTabs == null) {
    fromTabs = [];
    browser.storage.local.get(null).then((results) => {
      for(let tab of results["Default"]) {
        fromTabs.push(tab);
      }
      updateTabLists();
    });
  }
}

// Update drop-down list of profiles on main HTML display.
// Called on creation of new profiles by user
// in order to keep display up to date.
// TODO: update to use already-stored profile_dict instead of regrabbing local storage?
// Note: taken and edited from window.js
function updateProfiles() {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    var keys = Object.keys(results);
    var dropdownMenuRight = document.getElementById('tab-profiles-right'); // HTMLOptionElement for the right drop-down menu
    var dropdownMenuLeft = document.getElementById('tab-profiles-left'); // HTMLOptionElement for the left drop-down menu
    var bufMenu1 = document.createDocumentFragment();
    var profile; // Working variables for usage with HTML elements

    // Loop through all keys to add profiles to drop-down menu
    for(let key of keys) {
      if(key != "working" && key != "env") { // We don't want to add the working tabs/env-vars as a profile
        profile = document.createElement('option');
        profile.value = key;
        profile.text = key;
        bufMenu1.appendChild(profile);
      }
    }

    // .replaceChildren() clears the document
    // fragment, so we need to make a copy
    var bufMenu2 = bufMenu1.cloneNode(true);
    dropdownMenuRight.replaceChildren(bufMenu1);
    dropdownMenuLeft.replaceChildren(bufMenu2);
  });
}

// Grab local storage to initialize profile storage.
// Note: taken from window.js
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

// List working tabs for creation of profiles.
// Note: taken and edited from window.js
function listWorkingTabs(divId, side) {
  let workingTabsList = document.getElementById(divId);
  let bufTabs = document.createDocumentFragment();
  bufTabs.appendChild(document.createElement('br'));

  for(let tab of (side ? toTabs : fromTabs)) {
    let tabCheckbox = document.createElement('input');
    let tabLabel = document.createElement('label');
    let maxLinkLength = 55;

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

    tabCheckbox.setAttribute('type', "checkbox");
    tabCheckbox.setAttribute('name', side ? "tabOptionRight" : "tabOptionLeft");
    tabCheckbox.setAttribute('id', `${tab.id}`);
    tabCheckbox.setAttribute('value', tab.url);
    tabCheckbox.setAttribute('title', tab.title);

    tabLabel.setAttribute('for', `${tab.id}`);

    let tabImage = document.createElement('img');
    tabImage.setAttribute('id', `${tab.id}`);
    tabImage.setAttribute('src', tab.favIconUrl);

    bufTabs.appendChild(tabCheckbox);
    bufTabs.appendChild(tabImage);
    bufTabs.appendChild(tabLabel);
    bufTabs.appendChild(document.createElement('br'));
  }
  workingTabsList.replaceChildren(bufTabs); // Required so working tabs list auto-updates on click in HTML
}

// Helper function to update both
// lists of tabs simultaneously
function updateTabLists() {
  listWorkingTabs('working-tabs', true);
  listWorkingTabs('list-tabs', false);
}

// Update working tabs (and list) when profile is selected.
// TODO: doesn't work if only one profile exists. Might not need
// to worry about this if we have a "default" profile in the future
// Note: taken from window.js
function toProfileSelect() {
  var profileName = document.getElementById('tab-profiles-right').value;
  toTabs = profile_dict[profileName];
  listWorkingTabs('working-tabs', true);
}

function fromProfileSelect() {
  var profileName = document.getElementById('tab-profiles-left').value;
  fromTabs = profile_dict[profileName];
  listWorkingTabs('list-tabs', false);
}

// Called when submit tabs button is pressed.
// Will loop through all checkboxes attached to listed tabs
// and record which are checked, adding them to the
// working tabs as well as the selected profile.
function submitTabs() {
  let tabsList = document.getElementsByName('tabOptionLeft');
  let imgList = document.getElementsByTagName('img');
  var checkedItems = [];

  // Locate all checked items
  // and add them to a list
  for(let tab in tabsList) {
    if(tabsList[tab].checked) {
      // Find matching favicon image
      let favIconUrl;
      for(let img in imgList) {
        if(imgList[img].id == tabsList[tab].id) {
          favIconUrl = imgList[img].getAttribute('src');
        }
      }

      checkedItems.push([tabsList[tab].title, tabsList[tab].value, favIconUrl, tabsList[tab].id]);
    }
  }

  // Add checked items to working tabs (so profile gets updated)
  for(let item in checkedItems) {
    toTabs.push({ title: checkedItems[item][0], url: checkedItems[item][1], favIconUrl: checkedItems[item][2] });
  }

  // Remove checked items from previously listed tabs on left
  fromTabs = fromTabs.filter((value, index, arr) => {
    for(let tab in checkedItems) {
      if(checkedItems[tab][1] == value.url) {
        return false;
      }
    }
    return true;
  });

  // Save modified profiles
  // Note: copied and edited from window.js saveProfile()
  var profileSelectBoxRight = document.getElementById('tab-profiles-right');
  var profileSelectBoxLeft = document.getElementById('tab-profiles-left');
  var storing = browser.storage.local.set({ [profileSelectBoxRight.value]: toTabs, [profileSelectBoxLeft.value]: fromTabs });
  storing.then(() => {
    initializeProfiles();
    updateProfiles();
    // listTabs(); // ?
    updateTabLists();
  });
}

document.addEventListener("DOMContentLoaded", loadDefault);
document.addEventListener("DOMContentLoaded", updateProfiles);
document.addEventListener("DOMContentLoaded", initializeProfiles);
