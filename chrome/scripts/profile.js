"use strict";

var submitButton = document.querySelector('.save');

submitButton.addEventListener('click', submitProfile);

// Create new profile with given name.
function submitProfile() {
  let textBox = document.getElementById('profile-name');
  chrome.storage.local.set({ [textBox.value]: [] }).then(() => {
    console.log("New profile created.");
    chrome.windows.getCurrent().then((results) => {
      chrome.windows.remove(results.id);
    });
  });
}
