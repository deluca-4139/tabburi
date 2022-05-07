"use strict";

var submitButton = document.querySelector('.save');

submitButton.addEventListener('click', submitProfile);

// Create new profile with given name.
function submitProfile() {
  let textBox = document.getElementById('profile-name');
  browser.storage.local.set({ [textBox.value]: [] }).then(() => {
    console.log("New profile created.");
    browser.windows.getCurrent().then((results) => {
      browser.windows.remove(results.id);
    });
  });
}
