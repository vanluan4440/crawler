chrome.devtools.panels.create(
    "Crawler",
    "icons/icon16.png",
    "panel.html",
    function (panel) {
        console.log("DevTools panel created");

        panel.onShown.addListener(function (panelWindow) {
            console.log("Panel shown");
        });

        panel.onHidden.addListener(function () {
            console.log("Panel hidden");
        });
    }
);

