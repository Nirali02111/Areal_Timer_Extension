(function (factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function () {
  "use strict";

  /**
   * The code was extracted from:
   * https://github.com/davidchambers/Base64.js
   */

  var chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function InvalidCharacterError(message) {
    this.message = message;
  }

  InvalidCharacterError.prototype = new Error();
  InvalidCharacterError.prototype.name = "InvalidCharacterError";

  function polyfill(input) {
    var str = String(input).replace(/=+$/, "");
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError(
        "'atob' failed: The string to be decoded is not correctly encoded."
      );
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = "";
      // get next character
      (buffer = str.charAt(idx++));
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer &&
      ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      // and if not first of each 4 characters,
      // convert the first 8 bits to one ascii character
      bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  }

  var atob =
    (typeof window !== "undefined" &&
      window.atob &&
      window.atob.bind(window)) ||
    polyfill;

  function b64DecodeUnicode(str) {
    return decodeURIComponent(
      atob(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
          code = "0" + code;
        }
        return "%" + code;
      })
    );
  }

  function base64_url_decode(str) {
    var output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        throw new Error("base64 string is not of the correct length");
    }

    try {
      return b64DecodeUnicode(output);
    } catch (err) {
      return atob(output);
    }
  }

  function InvalidTokenError(message) {
    this.message = message;
  }

  InvalidTokenError.prototype = new Error();
  InvalidTokenError.prototype.name = "InvalidTokenError";

  function jwtDecode(token, options) {
    if (typeof token !== "string") {
      throw new InvalidTokenError("Invalid token specified: must be a string");
    }

    options = options || {};
    var pos = options.header === true ? 0 : 1;

    var part = token.split(".")[pos];
    if (typeof part !== "string") {
      throw new InvalidTokenError(
        "Invalid token specified: missing part #" + (pos + 1)
      );
    }

    try {
      var decoded = base64_url_decode(part);
    } catch (e) {
      throw new InvalidTokenError(
        "Invalid token specified: invalid base64 for part #" +
          (pos + 1) +
          " (" +
          e.message +
          ")"
      );
    }

    try {
      return JSON.parse(decoded);
    } catch (e) {
      throw new InvalidTokenError(
        "Invalid token specified: invalid json for part #" +
          (pos + 1) +
          " (" +
          e.message +
          ")"
      );
    }
  }

  /*
   * Expose the function on the window object
   */

  //use amd or just through the window object.
  if (window) {
    if (typeof window.define == "function" && window.define.amd) {
      window.define("jwt_decode", function () {
        return jwtDecode;
      });
    } else if (window) {
      window.jwt_decode = jwtDecode;
    }
  }
});
//# sourceMappingURL=jwt-decode.js.map

function convertMinuteToTime(value) {
  if (value !== undefined) {
    let secToHr = "00:00:00";
    if (value !== "" && value !== null) {
      let totalSeconds = value;
      totalSeconds = totalSeconds.toString();
      totalSeconds = totalSeconds.split("-");
      let sign = totalSeconds.length === 2 ? "-" : "";
      let dt = totalSeconds.length === 2 ? totalSeconds[1] : totalSeconds[0];
      let fullDate = new Date(dt * 1000).toISOString();

      let monthsStr = fullDate.substr(5, 2);
      let daysStr = fullDate.substr(8, 2);
      let hoursStr = fullDate.substr(11, 2);
      let minutesStr = fullDate.substr(14, 2);
      let secondsStr = fullDate.substr(17, 2);

      let months = parseInt(monthsStr);
      let days = parseInt(daysStr);
      let hours = parseInt(hoursStr);
      let minutes = parseInt(minutesStr);
      let seconds = parseInt(secondsStr);
      if (months > 1) {
        days += (months - 1) * 30;
      }
      if (days > 1) {
        hours += (days - 1) * 24;
      }

      if (hours.toString().length === 2) {
        hoursStr = ("0" + hours).slice(-2);
      } else {
        hoursStr = hours.toString();
      }
      minutesStr = ("0" + minutes).slice(-2);
      secondsStr = ("0" + seconds).slice(-2);

      secToHr = sign + hoursStr + ":" + minutesStr + ":" + secondsStr;
      secToHr = secToHr.toString();
    }
    return secToHr;
  }
}

/**
 * Check is authenticated with Areal
 * @returns
 */
function isAuthenticated() {
  return new Promise((resolve, reject) => {
    chrome.storage.local
      .get(["authInfo", "authUser", "authRole", "sourceId"])
      .then((storageData) => {
        if (
          !storageData.authInfo ||
          (storageData.authInfo && !storageData.authInfo.accessToken)
        ) {
          reject(false);
          return;
        }

        resolve(storageData.authInfo || null);
      });
  });
}

function isSuccessResponse(value) {
  return value === "Success";
}

function sessionAlert() {
  alert("Session Expired. Please open Areal Timer Extension");
}

function loginAlert() {
  alert("Please Login to Areal Timer using the Extension");
}

function getTaskIdFromUrl(urlString) {
  const isFullPage = /\/f$/.test(urlString);

  const isInBox = /\/inbox\//.test(urlString);

  const urlArray = urlString.split("/");
  if (isInBox) {
    return urlArray[urlArray.length - 2];
  }

  if (isFullPage) {
    return urlArray[urlArray.length - 2];
  }

  return urlArray[urlArray.length - 1];
}
