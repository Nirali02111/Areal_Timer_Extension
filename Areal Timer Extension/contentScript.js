const UI_ENUM = {
  START_TIMER_LABEL: "Start Timer",
  STOP_TIMER_LABEL: "Stop Timer",
  CUSTOM_FIELD_LABEL_INVALID_CLASS : "custom-field-label-invalid",
  CUSTOM_FIELD_VALUE_INVALID :"custom-field-value-invalid"
};

var timerInterval = null;

var Areal = {
  config: {
    wrapperDiv: null,
    taskInfoBlock: null,
    allTaskInfoBlock: null,
    toggleBlock: null,
    tooltipBlock: null,
    timerStartBtn: null,
    arealTimerIcon: null,
    timerStopBtn: null,
    timerCounterSpan: null,
    totalTimeTrackSpan: null,
    totalTimeTrackMeSpan: null,
    allTasksTotalTimerMeSpan: null,
    allTasksTotalTimerAllSpan: null,

    isToggleIsRunning: false,

    brandCustomField: {
      isValid: true,
      labelId: "",
      htmlId: "",
    },

    billingRefCustomField: {
      isValid: true,
      labelId: "",
      htmlId: "",
    },
  },

  init: function () {
    Areal.config.wrapperDiv = $("<div>", {
      text: "",
      id: "areal-timer-wrapper",
      class: "areal-timer-wrapper",
    });

    Areal.config.wrapperDiv.insertBefore(getTaskPaneResizeListenerContainer());
  },

  bindTotalTimer: function (displayValue) {
    const textAll = Areal.getAllMessage(displayValue);
    Areal.config.totalTimeTrackSpan = $("<span>", {
      id: "areal-timer-total",
      class: "total-timer-total",
      text: textAll,
    });
  },

  bindTotalMeTimer: function (displayValue) {
    const textValue = Areal.getMeMessage(displayValue);
    Areal.config.totalTimeTrackMeSpan = $("<span>", {
      id: "areal-timer-total-me",
      class: "total-timer-total-me",
      text: textValue,
    });
  },

  bindAllTasksTotalMeTimer: function (displayValue) {
    const textValue = Areal.getAllTaskMeMessage(displayValue);
    Areal.config.allTasksTotalTimerMeSpan = $("<span>", {
      id: "areal-timer-all-tasks-total-me",
      class: "total-timer-total-me",
      text: textValue,
    });
  },

  bindAllTasksTotalAllTimer: function (displayValue) {
    const textValue = Areal.getAllTaskAllMessage(displayValue);
    Areal.config.allTasksTotalTimerAllSpan = $("<span>", {
      id: "areal-timer-all-tasks-total-me",
      class: "total-timer-total",
      text: textValue,
    });
  },

  bindTaskInfoBlock: function (displayValue, displayMeValue) {
    Areal.config.taskInfoBlock = $("<div>", {
      class: "areal-block",
    });

    Areal.config.taskInfoBlock.append(
      $("<label>", {
        text: "Total timed this task:",
      })
    );

    let taskInfoTimerDiv = $("<div>",{
      class: 'task-info'
    });
    
    Areal.config.taskInfoBlock.append(taskInfoTimerDiv);
    Areal.bindTotalMeTimer(displayMeValue);
    Areal.bindTotalTimer(displayValue);

    taskInfoTimerDiv.append(Areal.config.totalTimeTrackMeSpan);
    taskInfoTimerDiv.append(Areal.config.totalTimeTrackSpan);
  },

  bindAllTaskInfoBlock: function (displayValue, displayMeValue) {
    Areal.config.allTaskInfoBlock = $("<div>", {
      class: "areal-block",
    });

    Areal.config.allTaskInfoBlock.append(
      $("<label>", {
        text: "All tasks with this ref #:",
      })
    );

    let allTaskInfoTimerDiv = $("<div>",{
      class: 'task-info'
    });
    
    Areal.config.allTaskInfoBlock.append(allTaskInfoTimerDiv);
    Areal.bindAllTasksTotalMeTimer(displayMeValue);
    Areal.bindAllTasksTotalAllTimer(displayValue);
    allTaskInfoTimerDiv.append(Areal.config.allTasksTotalTimerMeSpan);
    allTaskInfoTimerDiv.append(Areal.config.allTasksTotalTimerAllSpan);
  },

  bindStartButton: function () {
    Areal.config.timerStartBtn = $("<button>", {
      text: UI_ENUM.START_TIMER_LABEL,
      class: "btn btn-start btn-success",
      id: "areal-timer-start-btn",
    });

    const startSVG = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="10.868"
    height="12.5"
    viewBox="0 0 10.868 12.5"
  >
    <g id="play" transform="translate(-9.004 -6.75)" opacity="0.9">
      <path
        id="Path_78"
        data-name="Path 78"
        d="M10.259,19.25a1.2,1.2,0,0,1-.594-.159A1.336,1.336,0,0,1,9,17.925V8.075a1.334,1.334,0,0,1,.661-1.166,1.193,1.193,0,0,1,1.215.015L19.3,11.963a1.223,1.223,0,0,1,0,2.072l-8.42,5.041A1.206,1.206,0,0,1,10.259,19.25Z"
        fill="#fff"
      />
    </g>
  </svg> Start`;

    Areal.config.timerStartBtn.html(startSVG);

    Areal.config.toggleBlock.append(Areal.config.timerStartBtn);

    Areal.config.timerStartBtn.hide();

    Areal.config.timerStartBtn.on("click", function () {
      if (Areal.config.isToggleIsRunning) {
        return;
      }

      Areal.config.timerStartBtn.prop('disabled', true);
      const taskId = getTaskIdFromUrl();
      const taskDetails = serverAPI.getAsanaTaskDetails(taskId);

      $.when(taskDetails).done(function (responseData) {
        Areal.config.timerStartBtn.prop('disabled', false);
        Areal.config.brandCustomField = responseData.brandCustomFieldObj;
        Areal.config.billingRefCustomField = responseData.billingRefCustomFieldObj;

        if (!Areal.config.brandCustomField.isValid ||!Areal.config.billingRefCustomField.isValid) {
          Areal.customFieldUpdateUI();
          return;
        }
        
        if (
          Areal.config.billingRefCustomField.isValid &&
          Areal.config.brandCustomField.isValid
        ) {
          
          $(Areal.config.brandCustomField.labelId).removeClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
          $(Areal.config.brandCustomField.htmlId).removeClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);
          
          $(Areal.config.billingRefCustomField.labelId).removeClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
          $(Areal.config.billingRefCustomField.htmlId).removeClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);

          Areal.hideCustomFieldValidationMsg();
          toggleTimerClick("start");
        }
      });
    });
  },

  //
  bindArealTimerButton: async function () {
    const { START_TIMER_LABEL } = UI_ENUM;
    let { toggleBlock, arealTimerIcon } = Areal.config;
    
    // Create Timer Button
    arealTimerIcon = $("<button>", {
      text: START_TIMER_LABEL,
      class: "icon",
      id: "areal-timer-icon-btn",
    }).html(`
      <svg width="38" height="39" viewBox="0 0 38 39" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M32 0H6C2.68629 0 0 2.68629 0 6V33C0 36.3137 2.68629 39 6 39H32C35.3137 39 38 36.3137 38 33V6C38 2.68629 35.3137 0 32 0Z" fill="#F7F9F8"/>
<path d="M32 0.5H6C2.96243 0.5 0.5 2.96243 0.5 6V33C0.5 36.0376 2.96243 38.5 6 38.5H32C35.0376 38.5 37.5 36.0376 37.5 33V6C37.5 2.96243 35.0376 0.5 32 0.5Z" stroke="#E2E5E5"/>
<path d="M19.145 29.276C17.7703 29.2774 16.4035 29.0683 15.092 28.656C13.9787 28.3019 12.8986 27.8508 11.864 27.308C11.738 27.243 11.728 27.189 11.798 27.071C12.188 26.413 12.568 25.75 12.958 25.091C12.9714 25.074 12.9812 25.0546 12.9869 25.0337C12.9926 25.0129 12.9939 24.9911 12.9909 24.9697C12.988 24.9483 12.9807 24.9277 12.9695 24.9092C12.9583 24.8907 12.9436 24.8746 12.926 24.862C12.3496 24.264 11.8683 23.581 11.499 22.837C11.0493 21.928 10.7658 20.9459 10.662 19.937C10.4561 17.9085 10.9985 15.8747 12.187 14.218C12.5001 13.776 12.8576 13.3672 13.254 12.998C14.0398 12.2627 14.9581 11.6835 15.96 11.291C16.6494 11.0187 17.3728 10.8417 18.11 10.765C19.1956 10.6543 20.2924 10.7562 21.339 11.065C22.2958 11.3422 23.1946 11.7901 23.992 12.387C24.6357 12.871 25.208 13.4433 25.692 14.087C26.152 14.6981 26.5267 15.369 26.806 16.081C27.5449 17.9748 27.5648 20.0736 26.862 21.981C26.5095 22.9658 25.9657 23.8711 25.262 24.645C25.232 24.678 25.205 24.714 25.177 24.745C24.977 24.988 24.977 24.991 25.127 25.255C25.435 25.788 25.75 26.317 26.061 26.848C26.083 26.886 26.1 26.928 26.121 26.968C26.266 27.238 26.265 27.235 25.996 27.374C25.1265 27.8275 24.2239 28.2146 23.296 28.532C22.4898 28.8089 21.6605 29.0134 20.818 29.143C20.2661 29.2342 19.7075 29.2797 19.148 29.279M12.148 19.523C11.999 19.523 11.848 19.523 11.701 19.523C11.601 19.523 11.568 19.563 11.583 19.662C11.604 19.794 11.614 19.928 11.629 20.062C11.7318 20.9069 11.9834 21.7269 12.372 22.484C12.6548 23.0374 13.004 23.5542 13.412 24.023C13.486 24.109 13.523 24.136 13.596 24.011C14.167 23.022 14.746 22.037 15.322 21.051L16.895 18.343C17.5617 17.1977 18.2284 16.0523 18.895 14.907C18.965 14.787 19.014 14.787 19.084 14.907C19.368 15.391 19.6507 15.8757 19.932 16.361C20.6074 17.519 21.2827 18.6767 21.958 19.834C22.333 20.476 22.714 21.114 23.09 21.756C23.528 22.506 23.964 23.2577 24.398 24.011C24.449 24.1 24.488 24.111 24.561 24.03C24.8351 23.7164 25.0845 23.3821 25.307 23.03C25.5983 22.5622 25.8368 22.0635 26.018 21.543C26.2223 20.9509 26.353 20.336 26.407 19.712C26.421 19.552 26.407 19.526 26.247 19.525C25.969 19.525 25.69 19.525 25.412 19.525C25.297 19.525 25.25 19.478 25.253 19.364C25.253 19.21 25.253 19.056 25.253 18.902C25.253 18.702 25.264 18.689 25.461 18.688C25.729 18.688 25.998 18.688 26.266 18.688C26.359 18.688 26.421 18.668 26.411 18.555C26.3707 18.03 26.2762 17.5106 26.129 17.005C25.8323 15.9962 25.3263 15.0612 24.644 14.261C24.568 14.173 24.517 14.161 24.432 14.247C24.232 14.459 24.016 14.66 23.813 14.872C23.74 14.948 23.69 14.946 23.619 14.872C23.49 14.734 23.356 14.601 23.219 14.472C23.147 14.404 23.152 14.356 23.219 14.289C23.429 14.089 23.632 13.873 23.843 13.67C23.927 13.59 23.934 13.536 23.843 13.457C23.4703 13.142 23.0685 12.8631 22.643 12.624C21.6984 12.0963 20.6515 11.7775 19.573 11.689C19.453 11.678 19.399 11.713 19.402 11.842C19.408 12.12 19.402 12.398 19.402 12.676C19.402 12.794 19.363 12.851 19.238 12.848C19.0694 12.8433 18.9004 12.8433 18.731 12.848C18.61 12.848 18.561 12.802 18.563 12.681C18.563 12.403 18.563 12.124 18.563 11.846C18.563 11.722 18.518 11.669 18.395 11.69C18.116 11.737 17.834 11.748 17.555 11.804C16.2918 12.0563 15.114 12.627 14.133 13.462C14.052 13.53 14.05 13.579 14.126 13.653C14.34 13.86 14.547 14.075 14.761 14.283C14.828 14.348 14.84 14.397 14.766 14.466C14.632 14.592 14.502 14.722 14.376 14.856C14.305 14.931 14.251 14.929 14.176 14.856C13.976 14.646 13.76 14.442 13.556 14.232C13.477 14.151 13.426 14.161 13.356 14.246C12.8685 14.8156 12.4691 15.455 12.171 16.143C12.0156 16.4984 11.8908 16.8664 11.798 17.243C11.6952 17.6633 11.6227 18.0904 11.581 18.521C11.568 18.654 11.605 18.689 11.728 18.687C12.011 18.687 12.295 18.687 12.578 18.687C12.685 18.687 12.733 18.731 12.731 18.838C12.731 19.0167 12.731 19.1953 12.731 19.374C12.731 19.484 12.68 19.525 12.576 19.523C12.432 19.523 12.288 19.523 12.144 19.523M18.964 28.41C19.4805 28.4167 19.9967 28.3832 20.508 28.31C22.0723 28.0751 23.5905 27.598 25.008 26.896C25.108 26.846 25.123 26.809 25.064 26.71C24.773 26.224 24.49 25.734 24.205 25.245L21.331 20.315C20.5824 19.0257 19.8327 17.7373 19.082 16.45C19.018 16.343 18.985 16.326 18.918 16.443C18.736 16.762 18.545 17.077 18.36 17.394C17.36 19.106 16.3624 20.818 15.367 22.53C14.5557 23.9207 13.7427 25.3097 12.928 26.697C12.858 26.815 12.88 26.861 12.999 26.915C14.078 27.4241 15.2067 27.8206 16.367 28.098C17.22 28.2948 18.0917 28.3991 18.967 28.409" fill="#1AA499"/>
<path opacity="0.5" d="M27.848 4.677C27.848 4.80961 27.9007 4.93679 27.9945 5.03056C28.0882 5.12432 28.2154 5.177 28.348 5.177H32.125L27.703 9.591C27.6308 9.68729 27.5958 9.80639 27.6043 9.92645C27.6128 10.0465 27.6644 10.1594 27.7495 10.2446C27.8346 10.3297 27.9475 10.3812 28.0676 10.3897C28.1876 10.3983 28.3067 10.3632 28.403 10.291L32.824 5.877V9.654C32.824 9.78661 32.8767 9.91379 32.9705 10.0076C33.0642 10.1013 33.1914 10.154 33.324 10.154C33.4566 10.154 33.5838 10.1013 33.6776 10.0076C33.7713 9.91379 33.824 9.78661 33.824 9.654V4.677C33.824 4.54439 33.7713 4.41722 33.6776 4.32345C33.5838 4.22968 33.4566 4.177 33.324 4.177H28.345C28.2129 4.17779 28.0865 4.23082 27.9934 4.3245C27.9003 4.41819 27.848 4.54491 27.848 4.677Z" fill="#1E1F21"/>
</svg>`);
  
    toggleBlock.append(arealTimerIcon);
  
    // Event Handler for Button Click
    arealTimerIcon.on("click", async function () {
      try {
        const taskId = getTaskIdFromUrl();
        const responseData = await serverAPI.getAsanaTaskDetails(taskId);
        const { billingRefNum: billingRef } = responseData.billingRefCustomFieldObj;
        const link = (taskId == billingRef)
          ? `https://admin-portal.c2p.group/app/arealtimeradmin/taskstatusmonitoring-66f4453ca1700700610df025?branch=main&billingRef=${billingRef}`
          : `https://admin-portal.c2p.group/app/arealtimeradmin/approvetimers-66f4453ca1700700610df026?taskid=${taskId}`;
          
        window.open(link, '_blank');
        
      } catch (error) {
        console.error("Error fetching task details:", error);
      }
    });
  },

  bindStopButton: function (displayValue) {
    Areal.config.timerStopBtn = $("<button>", {
      text: convertMinuteToTime(displayValue),
      class: "btn btn-stop",
      id: "areal-timer-stop-btn",
    });

    const stopSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
    <g id="Group_194" data-name="Group 194" transform="translate(-1801 -478)" opacity="0.9">
      <rect id="Rectangle_156" data-name="Rectangle 156" width="4" height="11" rx="1" transform="translate(1801 478)" fill="#fff"/>
      <rect id="Rectangle_157" data-name="Rectangle 157" width="4" height="11" rx="1" transform="translate(1808 478)" fill="#fff"/>
    </g>
  </svg>`;

    Areal.config.timerStopBtn.html(stopSVG);
    Areal.config.toggleBlock.append(Areal.config.timerStopBtn);
    Areal.config.timerStopBtn.hide();

    Areal.config.timerStopBtn.on("click", function () {
      if (Areal.config.isToggleIsRunning) {
        return;
      }

      toggleTimerClick("stop");
    });
  },

  bindArealTooltip: function () {
    Areal.config.tooltipBlock = $("<div>", {
      id: "areal-timer-tooltip",
      class: "areal-timer-tooltip",
    });
    const title = $("<h4>", { id: "areal-timer-tooltip-title", text: "" });
    const timed = $("<h5>", {
      id: "areal-timer-tooltip-time",
      text: "Timed: 05:25:34",
    });
    const closedBtn = $("<button>", { class: "close" });

    Areal.config.tooltipBlock.append(title);
    Areal.config.tooltipBlock.append(timed);
    Areal.config.tooltipBlock.append(closedBtn);
    Areal.config.toggleBlock.append(Areal.config.tooltipBlock);
    closedBtn.on("click", function () {
      Areal.config.tooltipBlock.hide();
    });
    Areal.config.tooltipBlock.hide();
  },

  displayTooltipMessage: function (title, time) {
    Areal.config.tooltipBlock.show();

    const message = `${title} timer was stopped`;

    $("#areal-timer-tooltip-title").text(message);
    $("#areal-timer-tooltip-time").text(`Timed: ${convertMinuteToTime(time)}`);

    setTimeout(function () {
      Areal.config.tooltipBlock.hide();
    }, 5000);
  },

  bindToggleBlock: function (isTimerRunning, displayValue) {
    Areal.config.toggleBlock = $("<div>", {
      class: "areal-block",
    });
  },

  customFieldUpdateUI: function () {
    if (!Areal.config.brandCustomField.isValid) {
      $(Areal.config.brandCustomField.labelId).addClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
      $(Areal.config.brandCustomField.htmlId).addClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);
    }

    if (!Areal.config.billingRefCustomField.isValid) {
      $(Areal.config.billingRefCustomField.labelId).addClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
      $(Areal.config.billingRefCustomField.htmlId).addClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);
    }

    Areal.displayCustomFieldValidation();
  },

  displayCustomFieldValidation: function () {
    if ($("#areal-timer-wrapper-custom-field-invalid").length !== 0) {
      return;
    }

    const invalidDiv = $("<div>", {
      id: "areal-timer-wrapper-custom-field-invalid",
      class: "areal-timer-wrapper-custom-field-invalid",
    });
    const message = $("<p>", { text: "Please fill the required fields before tracking time" });
    invalidDiv.append(message);
    invalidDiv.insertAfter(Areal.config.wrapperDiv);
  },

  hideCustomFieldValidationMsg: function () {
    $("#areal-timer-wrapper-custom-field-invalid").remove();
  },

  getAllMessage: function (displayValue) {
    return `All members: ${convertMinuteToTime(displayValue)}`;
  },

  getMeMessage: function (displayValue) {
    return `${convertMinuteToTime(displayValue)}`;
  },

  getAllTaskMeMessage: function (displayValue) {
    return `${convertMinuteToTime(displayValue)}`;
  },

  getAllTaskAllMessage: function (displayValue) {
    return `All members: ${convertMinuteToTime(displayValue)}`;
  },
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.id !== chrome.runtime.id) {
    sendResponse();
    return;
  }

  if (request.message === "authenticate") {
    window.location.reload();
  }

  if (request.message === "reload-asana-page") {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    reInitializeAreal();
  }

  if (request.type === "URL_CHANGE") {
    $(document).ready(function () {
      checkArealOnAsana();
    });

    sendResponse(request.type);
    return;
  }

  if (request.type === "FULL_SCREEN_MODE") {
    $(document).ready(function () {
      checkArealOnAsanaFullscreenMode();
    });
    sendResponse(request.type);
    return;
  }

  if (request.type === "INBOX_MODE") {
    $(document).ready(function () {
      checkArealOnAsanaInbox();
    });
    sendResponse(request.type);
    return;
  }
});

function getArealTimerWrapperDiv() {
  return $("#areal-timer-wrapper")
}

function getTaskPaneResizeListenerContainer() {
  return $(".TaskPane-resizeListenerContainer")
}

function mutationCommon() {
  if (getTaskPaneResizeListenerContainer().length > 0) {
    if (getArealTimerWrapperDiv().length === 0) {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      initAreal();
    }
  }
}

function watchInPage(element, identifierToDome, isFull = false) {
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutationRecord) {
        mutationCommon();
    });
  });

  observer.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

function checkArealOnAsana() {
  var asanaPage$ = $("#asana_main_page");

  if (asanaPage$.length === 0) {
    return;
  }

  watchInPage(
    asanaPage$[0],
    ".FullWidthPageStructureWithDetailsOverlay-detailsOverlay.FullWidthPageStructureWithDetailsOverlay-detailsOverlay--visible"
  );
}

function checkArealOnAsanaFullscreenMode() {
  var asanaPage$ = $("#asana_full_page");

  if (asanaPage$.length === 0) {
    return;
  }

  watchInPage(
    asanaPage$[0],
    "div.Pane.FocusModePage-taskPane.Stack.Stack--align-stretch.Stack--direction-column.Stack--display-block.Stack--justify-start",
    true
  );
}

function checkArealOnAsanaInbox() {
  var asanaPage$ = $("#asana_main");

  if (asanaPage$.length === 0) {
    return;
  }

  watchInPage(
    asanaPage$[0],
    "div.InboxPanesOrEmptyState-pane.InboxPanesOrEmptyState-detailsPane"
  );
}


function reInitializeAreal() {
  Areal.config.wrapperDiv.remove()
  Areal.init();
  addStartTimer();
}


function initAreal() {
  Areal.init();
  addStartTimer();
}

function addStartTimer() {
  if (getArealTimerWrapperDiv().length > 0) {
    timerInfoAPI(function (res) {
      addUI(res.isTimerRunning, res);
    });
  }
}

function refreshCustomField() {
  const taskId = getTaskIdFromUrl();

  const taskDetails = serverAPI.getAsanaTaskDetails(taskId);

  $.when(taskDetails).done(function (responseData) {

    Areal.config.brandCustomField = responseData.brandCustomFieldObj;
    Areal.config.billingRefCustomField = responseData.billingRefCustomFieldObj;


    if (Areal.config.brandCustomField.isValid) {
      $(Areal.config.brandCustomField.labelId).removeClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
      $(Areal.config.brandCustomField.htmlId).removeClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);
    }

    if (Areal.config.billingRefCustomField.isValid) {
      $(Areal.config.billingRefCustomField.labelId).removeClass(UI_ENUM.CUSTOM_FIELD_LABEL_INVALID_CLASS);
      $(Areal.config.billingRefCustomField.htmlId).removeClass(UI_ENUM.CUSTOM_FIELD_VALUE_INVALID);
    }

    if (
      Areal.config.billingRefCustomField.isValid &&
      Areal.config.brandCustomField.isValid
    ) {
      Areal.hideCustomFieldValidationMsg();
    }
  });
}

function addUI(isTimerRunning, responseData) {
  if (getArealTimerWrapperDiv().length > 0) {
    Areal.bindTaskInfoBlock(
      responseData.totalTimeTracked,
      responseData.loggedInUserTimeTracked,
    );
    
    const taskId = getTaskIdFromUrl();
    const { billingRefNum: billingRef } = responseData.billingRefCustomFieldObj;
    const parendTask = (taskId == billingRef);

      if (parendTask) {
        (async () => {
          const response = await childTrackerInfo();
          if(response){
            Areal.bindAllTaskInfoBlock(
              response.totalRefTracked,
              response.totalRefTrackedUser
            );

            Areal.config.wrapperDiv.append(Areal.config.allTaskInfoBlock);
            Areal.config.wrapperDiv.append(Areal.config.toggleBlock);
        }
        })();
      }

    Areal.config.brandCustomField = responseData.brandCustomFieldObj;
    Areal.config.billingRefCustomField = responseData.billingRefCustomFieldObj;

    Areal.bindToggleBlock(isTimerRunning, responseData.timeTrackedNow);

    Areal.bindStartButton();
    Areal.bindStopButton(responseData.timeTrackedNow);
    
    Areal.bindArealTimerButton();
    Areal.bindArealTooltip();

    if (isTimerRunning) {
      Areal.config.timerStartBtn.hide();
      Areal.config.timerStopBtn.show();
      upTimer(responseData);
    } else {
      Areal.config.timerStartBtn.show();
      Areal.config.timerStopBtn.hide();
    }

    Areal.config.wrapperDiv.append(Areal.config.taskInfoBlock);
    if(!parendTask) Areal.config.wrapperDiv.append(Areal.config.toggleBlock);
  }
}

function getTaskIdFromUrl() {
  const val = $(".TaskPane").data("task-id");

  if (val) {
    return val;
  }

  return;
}

function toggleTimerClick(toggleType) {

  const taskId = getTaskIdFromUrl();

  if (!taskId) {
    return;
  }

  toggleTimerAPI(taskId, toggleType);
}

function timerInfoAPI(doAfterTaskTrackingInfoFunction) {
  const taskId = getTaskIdFromUrl();

  $.when(serverAPI.getTaskInfoRequest(taskId))
    .done(function (responseData) {
      doAfterTaskTrackingInfoFunction(responseData);
    })
    .fail(function () {
      getArealTimerWrapperDiv().append(
        $("<span>", {
          text: "Please Login to Areal Timer using the Extension",
          class: "badge",
        })
      );
    });  
}

async function childTrackerInfo() {
  try {
    const taskId = getTaskIdFromUrl();
    const responseData = await serverAPI.getChildTrackingInfo(taskId);
    return responseData;
  } catch (error) {
    console.error('Error fetching child tracking info:', error);
    return null; // Handle the error case
  }
}

function toggleTimerAPI(taskId, toggleType) {
  Areal.hideCustomFieldValidationMsg();

  $.when(serverAPI.toggleTimerRequest(taskId, toggleType)).done(function (
    responseData
  ) {
    if (responseData.previousTaskName && responseData.previousTimeTracked) {
      Areal.displayTooltipMessage(
        responseData.previousTaskName,
        responseData.previousTimeTracked
      );

      chrome.runtime.sendMessage(chrome.runtime.id, { message: "active-task-change" });
    }

    timerInfoAPI(function (resInfo) {
      Areal.config.brandCustomField = resInfo.brandCustomFieldObj;
      Areal.config.billingRefCustomField = resInfo.billingRefCustomFieldObj;

      if (resInfo.isTimerRunning) {
        Areal.config.timerStartBtn.hide();
        Areal.config.timerStopBtn.show();

        upTimer(resInfo);
      }

      if (!resInfo.isTimerRunning) {
        Areal.config.timerStartBtn.show();
        Areal.config.timerStopBtn.hide();
        Areal.config.totalTimeTrackSpan.text(
          Areal.getAllMessage(resInfo.totalTimeTracked)
        );
        Areal.config.totalTimeTrackMeSpan.text(
          Areal.getMeMessage(resInfo.loggedInUserTodayTimeTracked)
        );
        clearTimer();
      }
    });
  });
}

function upTimer(response) {
  timerShow(response.timeTrackedNow);

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
  const stopButton = Areal.config.timerStopBtn;
  const timeText = convertMinuteToTime(seconds);

  // Clear only the existing text content while keeping the SVG
  stopButton.contents().filter(function () {
    return this.nodeType === Node.TEXT_NODE;
  }).remove();

  // Append the new time text
  stopButton.append(document.createTextNode(` ${timeText}`));
}
