document.addEventListener("click", (e) => {
  if(e.target.id === "create-window") {
    let createData = {
      type: "panel",
      url: "../htmls/window.html"
    };
    let creating = browser.windows.create(createData);
    creating.then(() => {
      console.log("test");
    });
  }

  e.preventDefault();
});
