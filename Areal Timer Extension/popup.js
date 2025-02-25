//https://smus.com/oauth2-chrome-extensions/
//https://gist.github.com/raineorshine/970b60902c9e6e04f71d

var timerInterval;

var ArealPopup = {
  config: {
    asanaTaskId: null,
    counterSpan: null,
    totalTimeTrackSpan: null,

    totalTimeTrackMeThisWeekSpan: null,
    totalTimeTrackMeSpan: null,

    taskTitleSpan: null,
    timerStartBtn: null,
    timerStopBtn: null,

    loader: null,


    brandCustomField: {
      isValid: false,
      labelId: "",
      htmlId: "",
    },

    billingRefCustomField: {
      isValid: false,
      labelId: "",
      htmlId: "",
    },

    dashboard$: function() {
      return $("#dashboard")
    },

    authSection$: function() {
      return $("#authSection")
    }
  },

  displayWelcome: function () {
    chrome.storage.local
      .get(["authInfo", "authUser", "authRole", "sourceId"])
      .then((storageData) => {
        const msg = `Welcome, ${storageData.authUser.username}`;
        $("#welcomeUserMessage").text(msg);
      });
  },
};


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === chrome.tabs.TabStatus.COMPLETE) {
    if (/app.asana.com/.test(tab.url)) {
      ArealPopup.config.asanaTaskId = getTaskIdFromUrl(tab.url);
      getRunningTimerInfo();
    }
  }
});

function getTaskIdFromActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      resolve(getTaskIdFromUrl(activeTab.url));
    });
  });
}

$(document).ready(function () {
  ArealPopup.config.authSection$().hide();
  ArealPopup.config.dashboard$().hide();

  ArealPopup.config.loader = $("#areal-loader")

  $("#closePopupId").on("click", function () {
    window.close();
  });

  $("#loginBtn").on("click", doLoginAction);
  $("#asanaLoginBtn").on("click", initAsanaAuth);

  isAuthenticated()
    .then((res) => {
      if (!res) {
        initAsanaAuth();
        return;
      }

      if (isTokenExpired(res.accessToken)) {
        refreshToken(res);
        return;
      }

      initDashboardView({});
    })
    .catch(() => {
      initAsanaAuth();
    });
});

function notifyToAsana() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: "authenticate" });
  });
}

function initHomePage() {
  ArealPopup.config.loader.hide()
  ArealPopup.config.authSection$().show();
  ArealPopup.config.dashboard$().hide();

  $("#username-valid-err").hide()
  $("#password-valid-err").hide()
  $("#server-error").hide()
}

function doLoginAction() {

  const loginBtn$ = $(this)

  loginBtn$.prop('disabled', true)

  const username = $("#arealUsername").val();
  const password = $("#arealPassword").val();

  const unameError =  $("#username-valid-err")
  const passError =  $("#password-valid-err")

  if (!username || !password) {
    if (!username) {
      unameError.show()
    }

    if (!password) {
      passError.show()
    }

    loginBtn$.prop('disabled', false)
    return
  }

  unameError.hide()
  passError.hide()

  loginBtn$.toggleClass("btn-loading")
  serverAPI
    .signInRequest(username, password)
    .done(function (responseData) {
      loginBtn$.toggleClass("btn-loading")
      loginBtn$.prop('disabled', false)
      initDashboardView(responseData);
    })
    .fail(function (err) {
      $("#server-error").show()
      loginBtn$.prop('disabled', false)
      loginBtn$.toggleClass("btn-loading")
      $("#server-error-msg").text(err.responseText)
    });
}

function refreshToken(res) {
  serverAPI
    .refreshTokenRequest(res)
    .done(function (responseData) {
      initDashboardView(responseData);
    })
    .fail(function () {
      initHomePage();
    });
}

function initDashboardView(response) {
  if (response.info) {
    chrome.storage.local.set({ authInfo: response.info });
  }

  if (response.user) {
    chrome.storage.local.set({ authUser: response.user });
  }

  if (response.roles) {
    chrome.storage.local.set({ authRole: response.roles });
  }

  if (response.accessToken) {
    chrome.storage.local.set({ authInfo: response });
    notifyToAsana();
  }

  ArealPopup.config.loader.hide()
  ArealPopup.config.dashboard$().show();
  ArealPopup.config.authSection$().hide();

  ArealPopup.config.taskTitleSpan = $("#taskTitle");
  ArealPopup.config.counterSpan = $("#popup-counter");
  ArealPopup.config.timerStartBtn = $("#timerStartBtn");
  ArealPopup.config.timerStopBtn = $("#timerStopBtn");

  ArealPopup.config.totalTimeTrackMeThisWeekSpan = $(
    "#totalTimeTrackMeThisWeekSpan"
  );

  ArealPopup.config.totalTimeTrackMeSpan = $("#totalTimeTrackMeSpan");

  ArealPopup.config.timerStartBtn.hide();
  ArealPopup.config.timerStopBtn.hide();

  ArealPopup.displayWelcome();

  getTaskIdFromActiveTab().then(function (taskId) {
    ArealPopup.config.asanaTaskId = taskId;
    getRunningTimerInfo();
  });

  ArealPopup.config.timerStartBtn.on("click", function () {

    serverAPI.getAsanaTaskDetails(ArealPopup.config.asanaTaskId)
    .done(function (responseData) {
      if(responseData){
        ArealPopup.config.brandCustomField = responseData.brandCustomFieldObj;
        ArealPopup.config.billingRefCustomField = responseData.billingRefCustomFieldObj;
        if (ArealPopup.config.brandCustomField.isValid && ArealPopup.config.billingRefCustomField.isValid) {
         toggleTimer("start");
         return;
       }
      }
    
    })
  });

  ArealPopup.config.timerStopBtn.on("click", function () {    
    if (ArealPopup.config.asanaTaskId) {
      toggleTimer("stop");
      return;
    }
  });

  $("#logout").on("click", function () {
    clearLocal();
  });
  $("#approve-timer").on("click",function () {
    window.open("https://admin-portal.c2p.group/app/arealtimeradmin/approvetimers-66f4453ca1700700610df026","_blank")
  })
  $("#feedback").on("click",function () {
    window.open("https://form.asana.com/?k=KCujQmh-VMPAaXqMIE68cQ&d=544557587490645","_blank")
  })
}

function clearLocal() {
  chrome.storage.local.clear(function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
      return;
    }

    initHomePage();
  });
}

function toggleTimer(toggleType) {
  $.when(
    serverAPI.toggleTimerRequest(ArealPopup.config.asanaTaskId, toggleType)
  ).done(function (responseData) {
    getRunningTimerInfo();
  });
}

function getRunningTimerInfo() {
  $.when(serverAPI.getUserTracking()).done(
    function (responseData) {
      responseData.timeTrackedNow = 0;
      ArealPopup.config.taskTitleSpan.text(responseData.currentTaskTrackingName);
      if(responseData.asanaTaskId){

        ArealPopup.config.asanaTaskId =responseData.asanaTaskId ;
      }
      if (responseData.isTimerRunning) {
        ArealPopup.config.timerStartBtn.hide();
        ArealPopup.config.timerStopBtn.show();

        var validDate = responseData.startedOn.replace(".", "");
        var starttime = moment.utc(validDate, "MM-DD-YYYY HH:mm:ss").local();
        const currentTime = moment();
        const startTimer = currentTime.diff(starttime, "seconds");
        responseData.timeTrackedNow = startTimer;
        upTimer(responseData);

        ArealPopup.config.totalTimeTrackMeThisWeekSpan.text(
          convertMinuteToTime(responseData.totalTrackedThisWeek)
        );

        ArealPopup.config.totalTimeTrackMeSpan.text(
          convertMinuteToTime(responseData.totalTrackedToday)
        );
      }

      if (!responseData.isTimerRunning) {
        ArealPopup.config.timerStartBtn.show();
        ArealPopup.config.timerStopBtn.hide();
        ArealPopup.config.counterSpan.text("00:00:00");
        ArealPopup.config.totalTimeTrackMeThisWeekSpan.text(
          convertMinuteToTime(responseData.totalTrackedThisWeek)
        );

        ArealPopup.config.totalTimeTrackMeSpan.text(
          convertMinuteToTime(responseData.totalTrackedToday)
        );
        clearTimer();
      }
    }
  );
  return;

  $.when(serverAPI.getTaskInfoRequest(ArealPopup.config.asanaTaskId)).done(
    function (responseData) {

      responseData.timeTrackedNow = 0;
      ArealPopup.config.brandCustomField = responseData.brandCustomFieldObj;
      ArealPopup.config.billingRefCustomField = responseData.billingRefCustomFieldObj;

      ArealPopup.config.taskTitleSpan.text(responseData.taskName);

      if (responseData.isTimerRunning) {
        ArealPopup.config.timerStartBtn.hide();
        ArealPopup.config.timerStopBtn.show();

        var validDate = responseData.startedOn.replace(".", "");
        var starttime = moment.utc(validDate, "MM-DD-YYYY HH:mm:ss").local();
        const currentTime = moment();
        const startTimer = currentTime.diff(starttime, "seconds");
        responseData.timeTrackedNow = startTimer;
        upTimer(responseData);

        ArealPopup.config.totalTimeTrackMeThisWeekSpan.text(
          convertMinuteToTime(responseData.loggedInUserTimeTrackedThisWeek)
        );

        ArealPopup.config.totalTimeTrackMeSpan.text(
          convertMinuteToTime(responseData.loggedInUserTodayTimeTracked)
        );
      }

      if (!responseData.isTimerRunning) {
        ArealPopup.config.timerStartBtn.show();
        ArealPopup.config.timerStopBtn.hide();
        ArealPopup.config.counterSpan.text("00:00:00");
        ArealPopup.config.totalTimeTrackMeThisWeekSpan.text(
          convertMinuteToTime(responseData.loggedInUserTimeTrackedThisWeek)
        );

        ArealPopup.config.totalTimeTrackMeSpan.text(
          convertMinuteToTime(responseData.loggedInUserTodayTimeTracked)
        );
        clearTimer();
      }
    }
  );
}

function initAsanaAuth() {

  ArealPopup.config.loader.show()
  ArealPopup.config.dashboard$().hide();
  ArealPopup.config.authSection$().hide();

  serverAPI.o2AuthRequest().done(function (resp) {
    lunchAuth(resp)
      .then((response) => {
        initDashboardView(response);
      })
      .catch(() => {
        clearLocal();
      });
  });
}

function lunchAuth(responseToken) {
  return new Promise((resolve, reject) => {
    const state = responseToken.state;
    const clientId = responseToken.clientId;
    const redirectUri = encodeURIComponent(
      chrome.identity.getRedirectURL("provider_cb")
    );
    const codeChallenge = responseToken.codeChallenge;

    const url = `https://app.asana.com/-/oauth_authorize?response_type=code&state=${state}&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=${codeChallenge}&scope=default`;

    chrome.identity.launchWebAuthFlow(
      { url: url, interactive: true },
      function (redirect_url) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }

        if (!redirect_url) {
          reject(false);
        }

        const params = redirect_url.split("?");

        const searchParams = new URLSearchParams(params[1]);
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        serverAPI
          .o2AuthCodeVerifyRequest(params[1], redirectUri)
          .done(function (authResponse) {
            resolve(authResponse);
          })
          .fail(() => {
            reject(false);
          });
      }
    );
  });
}

function upTimer(response) {
  timerInterval = setInterval(() => {
    response.timeTrackedNow += 1;
    timerShow(response.timeTrackedNow);
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

function timerShow(seconds) {
  ArealPopup.config.counterSpan.html(convertMinuteToTime(seconds));
}
