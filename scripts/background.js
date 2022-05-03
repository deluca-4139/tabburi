// Called when a new window is opened.
// Checks to see if the "switching" environment variable
// is set, in which case it takes control from the openTabs()
// function from window.js and opens the tabs from the
// selected profile in the newly opened window.
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
        if(results["env"]["discarded"]) {
          browser.tabs.create({
            //windowId: windowInfo["id"], // might need this if for some reason tabs aren't being opened in the proper window
            active: false,
            discarded: true,
            //favIconUrl: parsedTabArr[tab]["favicon"], // This isn't possible to set in tabs.create, leaving in case I manage to figure out how to do so
            title: parsedTabArr[tab]["title"],
            url: parsedTabArr[tab]["url"]
          });
        }
        else {
          browser.tabs.create({
            active: false,
            discarded: false,
            url: parsedTabArr[tab]["url"]
          });
        }
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

// Called when any tab modification is detected.
// Updates current profile to reflect updated tabs.
// First checks to make sure the wizard window was
// not the window that was just opened, in which
// case it immediately returns so as to not interact.
function updateProfile(info) {
  var getStorage = browser.storage.local.get(null);
  getStorage.then((results) => {
    if(results["env"]["switching"] || results["env"]["wizard"][0]) {
      return null;
    }

    browser.tabs.query({currentWindow: true}).then((tabs) => {
      browser.storage.local.set({ [results["env"]["current"]]: tabs });
    });

  });
}

browser.tabs.onCreated.addListener(updateProfile);
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Might want to refactor this at some point,
  // since it's so similar to the updateProfile
  // function, but this works for now.
  browser.storage.local.get(null).then((results) => {
    if(results["env"]["switching"] || results["env"]["wizard"][0]) {
      return null;
    }

    browser.tabs.query({currentWindow: true}).then((tabs) => {
      browser.storage.local.set({ [results["env"]["current"]]: tabs.filter((value, index, arr) => {
        return (value.id === tabId) ? false : true;
      }) });
    });
  });
});
browser.tabs.onMoved.addListener((tabId, moveInfo) => { updateProfile(moveInfo); });
browser.tabs.onUpdated.addListener((tabId, updateInfo) => {
  if(updateInfo["status"] === "complete" && updateInfo["url"] !== "about:blank") {
    updateProfile(updateInfo);
  }
});
browser.tabs.onAttached.addListener((tabId, attachInfo) => { updateProfile(attachInfo); });
browser.tabs.onDetached.addListener((tabId, detachInfo) => { updateProfile(detachInfo); });

browser.windows.onCreated.addListener((windowInfo) => { windowOpen(windowInfo); });
browser.windows.onRemoved.addListener((windowId) => {
  browser.storage.local.get(null).then((results) => {
    if(windowId == results["env"]["wizard"][1]) {
      results["env"]["wizard"] = [false, -1];
      browser.storage.local.set({ "env": results["env"] }).then(() => {
        console.log("Wizard closed.");

        browser.tabs.query({currentWindow: true}).then((tabs) => {
          let removeTabs = [];
          for(let tab in tabs) {
            let tabExists = false;
            for(let tabCheck in results[results["env"]["current"]]) {
              if(tabs[tab].id == results[results["env"]["current"]][tabCheck].id) {
                tabExists = true;
              }
            }

            if(!tabExists) {
              removeTabs.push(tabs[tab].id);
            }
          }

          browser.tabs.remove(removeTabs).then(() => {
            console.log("Window updated.");
          });
        });
      });
    }
  });
});
