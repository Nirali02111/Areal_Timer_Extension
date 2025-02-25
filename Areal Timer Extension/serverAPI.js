const serverAPI = {
  o2AuthRequest: function () {
    return $.get(`${API_SERVER}auth/GeneratePKCE`);
  },

  o2AuthCodeVerifyRequest: function (code, redirectUri) {
    const url2 = `${API_SERVER}auth/Code?${code}&customRedirectUri=${redirectUri}`;
    return $.get(url2);
  },

  storageAPI: function () {
    var storage = $.Deferred();

    chrome.storage.local.get(["authInfo"]).then((storageData) => {
      if (
        !storageData.authInfo ||
        (storageData.authInfo && !storageData.authInfo.accessToken)
      ) {
        storage.reject(new Error("Login Required"));
        return;
      }

      if (serverAPI.isTokenExpired(storageData.authInfo.accessToken)) {
        $.when(serverAPI.refreshTokenRequest(storageData.authInfo)).done(
          function (responseData) {
            chrome.storage.local.set({ authInfo: responseData });
            storage.resolve(responseData.accessToken);
          }
        );

        return;
      }
      storage.resolve(storageData.authInfo.accessToken);
    });

    return storage.promise();
  },

  isTokenExpired: function (accessToken) {
    const decoded = jwt_decode(accessToken);

    if (decoded.exp) {
      return decoded.exp * 1000 < new Date().getTime();
    }

    return true;
  },

  signInRequest: function (username, password) {
    const loginPayload = {
      username: username,
      password: password,
      macAddress: "11:11:11:11",
    };

    return $.ajax({
      url: `${API_SERVER}auth/signin`,
      type: "POST",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        ...loginPayload,
      }),
    });
  },

  refreshTokenRequest: function (res) {
    const refreshPayload = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };
    return $.ajax({
      url: `${API_SERVER}auth/refresh-token`,
      type: "POST",
      dataType: "json",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        ...refreshPayload,
      }),
    });
  },

  getAsanaTaskDetails: function (taskId) {
    const request = $.Deferred();

    const brandCustomFieldObj = {
      isValid: true,
      labelId: "",
      htmlId: "",
    };

    const billingRefCustomFieldObj = {
      isValid: true,
      labelId: "",
      htmlId: "",
    };

    $.ajax({
      url: `https://app.asana.com/api/1.0/tasks/${taskId}`,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("X-Allow-Asana-Client", "1");
      },
    })
      .done(function (res) {
        if (
          res &&
          res.data &&
          res.data.custom_fields &&
          res.data.custom_fields.length !== 0
        ) {
          const brandField = res.data.custom_fields.find((o) => {
            return (
              o.name.includes("Brand") &&
              o.resource_subtype === "enum" &&
              o.resource_type === "custom_field"
            );
          });

          const billingRefField = res.data.custom_fields.find((o) => {
            return (
              o.name.includes("Billing Reference#") &&
              o.resource_subtype === "text" &&
              o.resource_type === "custom_field"
            );
          });

          if (brandField) {
            brandCustomFieldObj.labelId = `#CustomPropertyRow-label${brandField.gid}`;
            brandCustomFieldObj.htmlId = `#CustomPropertyRow-field${brandField.gid}`;
            brandCustomFieldObj.isValid = !brandField.display_value ? false : true;
          }

          if (billingRefField) {
            billingRefCustomFieldObj.labelId = `#CustomPropertyRow-label${billingRefField.gid}`;
            billingRefCustomFieldObj.htmlId = `#CustomPropertyRow-field${billingRefField.gid}`;
            billingRefCustomFieldObj.isValid = !billingRefField.display_value ? false: true;
            billingRefCustomFieldObj.billingRefNum = billingRefField.display_value;
          }
        }

        request.resolve({
          brandCustomFieldObj,
          billingRefCustomFieldObj,
        });
      })
      .fail(function (err) {
        request.reject(err);
      });

    return request.promise();
  },

  getTaskInfoRequest: function (taskId) {
    const request = $.Deferred();

    const storage = serverAPI.storageAPI();

    const taskDetails = serverAPI.getAsanaTaskDetails(taskId);

    $.when(taskDetails, storage)
      .done(function (asanaTaskDetails, accessToken) {
        $.ajax({
          url: `${API_SERVER}Asana/GetTaskTrackingInfo`,
          type: "GET",
          dataType: "json",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          },
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            asanaTaskId: taskId,
          },
          success: function (responseData) {
            responseData.timeTrackedNow = 0;

            responseData.brandCustomFieldObj =
              asanaTaskDetails.brandCustomFieldObj;
            responseData.billingRefCustomFieldObj =
              asanaTaskDetails.billingRefCustomFieldObj;

            if (responseData.isTimerRunning) {
              const validDate = responseData.startedOn.replace(".", "");
              const starttime = moment
                .utc(validDate, "MM-DD-YYYY HH:mm:ss")
                .local();
              const currentTime = moment();
              const startTimer = currentTime.diff(starttime, "seconds");
              responseData.timeTrackedNow = startTimer;
            }

            request.resolve(responseData);
          },
          error: function (err) {
            request.reject(err);
          },
        });
      })
      .fail(function (err) {
        request.reject(err);
      });

    return request.promise();
  },

  getChildTrackingInfo: async function (taskId) {
    try {
      const [asanaTaskDetails, accessToken] = await Promise.all([
        serverAPI.getAsanaTaskDetails(taskId),
        serverAPI.storageAPI(),
      ]);
  
      const response = await $.ajax({
        url: `${API_SERVER}Asana/GetChildTrackingInfo`,
        type: "GET",
        dataType: "json",
        beforeSend: (xhr) => {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        data: { asanaTaskId: taskId },
      });
  
      return response;
    } catch (error) {
      // Handle errors
      throw error;
    }
  },

  getUserTracking: function(taskId) {
    const request = $.Deferred();

    const storage = serverAPI.storageAPI();

    $.when(storage)
      .done(function (accessToken) {
        $.ajax({
          url: `${API_SERVER}Asana/GetUserTracking`,
          type: "GET",
          dataType: "json",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          },
          headers: {
            "Content-Type": "application/json",
          },
          success: function (responseData) {
            responseData.timeTrackedNow = 0;

            if (responseData.isTimerRunning) {
              const validDate = responseData.startedOn.replace(".", "");
              const starttime = moment
                .utc(validDate, "MM-DD-YYYY HH:mm:ss")
                .local();
              const currentTime = moment();
              const startTimer = currentTime.diff(starttime, "seconds");
              responseData.timeTrackedNow = startTimer;
            }
            
            request.resolve(responseData);
          },
          error: function (err) {
            request.reject(err);
          },
        });
      })
      .fail(function (err) {
        request.reject(err);
      });

    return request.promise();
  },


  toggleTimerRequest: function (asanaTaskId, toggleType) {
    const request = $.Deferred();

    const storage = serverAPI.storageAPI();

    $.when(storage)
      .done(function (accessToken) {
        $.ajax({
          url: `${API_SERVER}Asana/ToggleTimer`,
          type: "POST",
          dataType: "json",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          },
          headers: {
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            toggleType: toggleType,
            asanaTaskId: asanaTaskId,
          }),
          success: function (responseData) {
            if (!isSuccessResponse(responseData.message)) {
              alert(responseData.message);
              return;
            }
            request.resolve(responseData);
          },
          error: function (err) {
            request.reject(err);
          },
        });
      })
      .fail(function (err) {
        request.reject(err);
      });

    return request.promise();
  },
};
