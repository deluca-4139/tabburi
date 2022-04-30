function addTab(tabInfo) {
  var getStorage = browser.storage.local.get(null);
  //console.dir(tabInfo);
  getStorage.then((results) => {
    if(results["env"]["switching"]) {
      // console.dir(results);
      // results["env"]["switching"] = false;
      // var storing = browser.storage.local.set({ "env": results["env"] });
      // storing.then(() => {
      //   console.log("Switching env var set to false.");
      // });
    }
  });
}

function removeTab(tabInfo) {

}

function windowOpen(windowInfo) {
  browser.storage.local.get(null).then((results) => {
    if(results["env"]["switching"]) {
      console.log("Background script receiving control from extension...");

      let newProfile = results["env"]["current"];
      console.log(`Switching to profile ${newProfile}...`);

      var parsedTabArr = [];
      // Mandatory parsing to make sure browser.windows.create doesn't throw a
      // malformed URL exception when attempting to create a privileged URL tab
      for(let tab in results[newProfile]) {
        try {
          let urlTest = new URL(results[newProfile][tab]["url"]);
          if(urlTest.protocol === "http:" || urlTest.protocol === "https:") {
            parsedTabArr.push(results[newProfile][tab]);
          }
        }
        catch {}
      }

      delete parsedTabArr[0]; // Delete first tab from array as it has already been created in the window

      for(let tab in parsedTabArr) {
        browser.tabs.create({
          //windowId: windowInfo["id"], // might need this if for some reason tabs aren't being opened in the proper window
          active: false,
          discarded: true,
          //favIconUrl: parsedTabArr[tab]["favicon"], // This isn't possible to set in tabs.create, leaving in case I manage to figure out how to do so
          title: parsedTabArr[tab]["title"],
          url: parsedTabArr[tab]["url"]
        });
      }

      results["env"]["switching"] = false;
      var storing = browser.storage.local.set({ "env": results["env"] });
      storing.then(() => {
        console.log("Switching env var set to false.");

        let closing = browser.windows.remove(results["env"]["window"]); // Might want to add in a checkbox to toggle this functionality in the future
        closing.then(() => {
          // These aren't being logged, and I'm not sure why.
          // The window exits properly, though, so... maybe unimportant?
          console.log(`Current profile set to ${newProfile}.`);
          console.log("Profile loaded successfully.");
        });
      });
    }
  });
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
