var submitTabsButton = document.querySelector('.submitTabs');

submitTabsButton.addEventListener('click', submitTabs);

// List tabs from current active window. Each tab has a checkbox and a favicon.
// Will need to change to replaceChildren() structure if list requires being updated.
function listTabs() {
  browser.tabs.query({windowId: 1}).then((tabs) => {
    let tabsList = document.getElementById('list-tabs');
    //let counter = 0; // Might want to re-add this in the future

    for(let tab of tabs) {
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

      tabLabel.setAttribute('for', `${tab.id}`);

      let tabImage = document.createElement('img');
      tabImage.setAttribute('src', tab.favIconUrl);

      tabsList.appendChild(tabCheckbox);
      tabsList.appendChild(tabImage);
      tabsList.appendChild(tabLabel);
      tabsList.appendChild(document.createElement('br'));
    }
  });
}

// Called when submit tabs button is pressed.
// Will loop through all checkboxes attached to listed tabs
// and record which are checked.
function submitTabs() {
  let tabsList = document.getElementsByName('tabWizardList');
  var checkedItems = [];
  for(let tab in tabsList) {
    if(tabsList[tab].checked) {
      checkedItems.push(tabsList[tab].value);
    }
  }
  console.log(checkedItems);
}

document.addEventListener("DOMContentLoaded", listTabs);
