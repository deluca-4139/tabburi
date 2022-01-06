function addTab(tabInfo) {
  var getStorage = browser.storage.local.get(null);
  //console.dir(tabInfo);
  getStorage.then((results) => {
    if(results["env"]["switching"]) {
      //console.dir(results);
      results["env"]["switching"] = false;
      var storing = browser.storage.local.set({ "env": results["env"] });
      storing.then(() => {
        console.log("Switching env var set to false.");
      });
    }
  });
}

function removeTab(tabInfo) {

}

function windowOpen(windowInfo) {
  //console.log("Window opened.");
  //console.dir(windowInfo);
}

browser.tabs.onCreated.addListener((tabId, removeInfo) => {
  addTab(tabId);
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  removeTab(removeInfo);
});

browser.windows.onCreated.addListener((windowInfo) => {
  windowOpen(windowInfo);
});
