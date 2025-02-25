function getMode(urlString) {
  const isFullPage = /\/f$/.test(urlString);

  const isInBox = /\/inbox\//.test(urlString);

  if (isInBox && isFullPage) {
    return "FULL_SCREEN_MODE";
  }

  return isInBox
    ? "INBOX_MODE"
    : isFullPage
    ? "FULL_SCREEN_MODE"
    : "URL_CHANGE";
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.id !== chrome.runtime.id) {
    sendResponse();
    return;
  }

  if (request.message === "active-task-change") {
    findAllAsanaUnActiveLinkTabs();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (/app.asana.com/.test(tab.url)) {
    const type = getMode(tab.url);

    chrome.tabs.sendMessage(
      tabId,
      {
        url: tab.url,
        type: type,
        changeInfo,
      },
      (responseFromContent) => {
        if (!chrome.runtime.lastError) {
        }
      }
    );
  }
});


/**
 * Find all Asana Link Tabs that are not active and send reload message to content script
 */
function findAllAsanaUnActiveLinkTabs() {
  const query = {
    currentWindow: true,    // select from current window
    highlighted: false,     // select only that are not activated 
    url: "*://app.asana.com/*", // select only that tab that have asana url
  };
  
  chrome.tabs.query(query, function (tabs) {
    for (let index = 0; index < tabs.length; index++) {
      const element = tabs[index];
      chrome.tabs.sendMessage(
        element.id,
        {
          message: "reload-asana-page"
        }
      );
    }
  });
}
