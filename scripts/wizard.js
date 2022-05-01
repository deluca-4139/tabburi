"use strict";

var submitTabsButton = document.querySelector('.submitTabs');

submitTabsButton.addEventListener('click', submitTabs);

var profile_dict = {};
var working_tabs = [];
var wizard_tabs = null;

document.getElementById('tab-profiles').onchange = profileSelect;

// List tabs from current active window.
// Each tab has a checkbox and a favicon.
// Note: taken and edited from window.js
function listTabs() {
  // Load the list of tabs if this is the first time
  // we're running the function; i.e. the window has
  // just been opened
  if(wizard_tabs == null) {
    wizard_tabs = [];
    browser.storage.local.get(null).then((results) => {
      for(let tab of results["Default"]) {
        wizard_tabs.push(tab);
      }
      return listTabs();
    });
  }

  let tabsListParent = document.getElementById('list-tabs');
  let tabsList = document.createDocumentFragment();
  //let counter = 0; // Might want to re-add this in the future

  for(let tab of wizard_tabs) {
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
    tabCheckbox.setAttribute('name', "tabWizardList");
    tabCheckbox.setAttribute('id', `${tab.id}`);
    tabCheckbox.setAttribute('value', tab.url);
    tabCheckbox.setAttribute('title', tab.title);

    tabLabel.setAttribute('for', `${tab.id}`);

    let tabImage = document.createElement('img');
    tabImage.setAttribute('id', `${tab.id}`);
    tabImage.setAttribute('src', tab.favIconUrl);

    tabsList.appendChild(tabCheckbox);
    tabsList.appendChild(tabImage);
    tabsList.appendChild(tabLabel);
    tabsList.appendChild(document.createElement('br'));
  }
  tabsListParent.replaceChildren(tabsList);
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
function listWorkingTabs() {
  let workingTabsList = document.getElementById('working-tabs');
  let bufTabs = document.createDocumentFragment();
  bufTabs.appendChild(document.createElement('br'));

  for(let tab of working_tabs) {
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
    tabCheckbox.setAttribute('name', "tabProfileList");
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

// Update working tabs (and list) when profile is selected.
// TODO: doesn't work if only one profile exists. Might not need
// to worry about this if we have a "default" profile in the future
// Note: taken from window.js
function profileSelect() {
  var profileName = document.getElementById('tab-profiles').value;
  working_tabs = profile_dict[profileName];
  listWorkingTabs();
}

// Called when submit tabs button is pressed.
// Will loop through all checkboxes attached to listed tabs
// and record which are checked, adding them to the
// working tabs as well as the selected profile.
function submitTabs() {
  let tabsList = document.getElementsByName('tabWizardList');
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
    working_tabs.push({ title: checkedItems[item][0], url: checkedItems[item][1], favIconUrl: checkedItems[item][2] });
  }

  // Remove checked items from previously listed tabs on left
  wizard_tabs = wizard_tabs.filter((value, index, arr) => {
    for(let tab in checkedItems) {
      if(checkedItems[tab][1] == value.url) {
        return false;
      }
    }
    return true;
  });

  // Save modified profiles
  // Note: copied and edited from window.js saveProfile()
  var profileSelectBox = document.getElementById('tab-profiles');
  var storing = browser.storage.local.set({ [profileSelectBox.value]: working_tabs, "Default": wizard_tabs });
  storing.then(() => {
    initializeProfiles();
    updateProfiles();
    listTabs();
    listWorkingTabs();
  });

}

document.addEventListener("DOMContentLoaded", listTabs);
document.addEventListener("DOMContentLoaded", updateProfiles);
document.addEventListener("DOMContentLoaded", initializeProfiles);
