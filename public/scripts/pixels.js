/*
Portable Pixels Script
----------------------

A configurable pixel tracking script that fires analytics events for page loads, link clicks, button clicks, and custom events.

Configuration:
  - Set window.PIXEL_CONFIG before this script loads, or call initPixelTracking(config)
  
Example config:
  window.PIXEL_CONFIG = {
    baseUrl: "https://improving.duckduckgo.com/t/",  // Default DuckDuckGo analytics endpoint
    pathPrefix: "/duckduckgo-help-pages/",  // Path prefix to strip (optional)
    pathPrefixToSanitize: "duckduckgo-help-pages-",  // Additional prefix to remove from sanitized paths (optional)
    allowedHostnames: ["help.duckduckgo.com"],  // Hostnames allowed to send full URLs (optional)
    externalLinkAllowList: {},  // Map of external URLs allowed to send full URLs (optional)
    eventPrefix: "subscription_support_",  // Prefix for event names in pixel URL (optional, defaults to "subscription_support_")
    buttonSelector: "article button",  // CSS selector for buttons to track (optional, defaults to "article button")
    trackButtonText: true,  // Whether to include button text (optional, defaults to true)
    trackButtonId: true,  // Whether to include button ID (optional, defaults to true)
    trackButtonClass: true,  // Whether to include button class (optional, defaults to true)
    maxButtonTextLength: 100,  // Maximum length of button text to send (optional, defaults to 100)
  };

Pixel format:
  [baseUrl][eventPrefix][sanitized-pathname]_[event]?[extra-data]

Examples:
  https://improving.duckduckgo.com/t/help_company-advertising-and-affiliates_load
  https://improving.duckduckgo.com/t/help_company-advertising-and-affiliates_click?link-url=https-reddit-com-r-duckduckgo
  https://improving.duckduckgo.com/t/help_company-advertising-and-affiliates_button-click?button-text=Get-Started&button-id=cta-button
  https://improving.duckduckgo.com/t/help_company-advertising-and-affiliates_script-loaded?script-name=analytics

Manual Event Tracking:
  // Fire a custom event
  window.firePixelEvent("script-loaded", { "script-name": "analytics", "version": "1.0" });
  
  // Fire an event with just a name
  window.firePixelEvent("video-played");
  
  // Fire an event in a callback
  someAsyncFunction().then(function() {
    window.firePixelEvent("async-complete", { "duration": "500ms" });
  });
*/

(function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
})(function () {
  // Default configuration
  const defaultConfig = {
    baseUrl: 'https://improving.duckduckgo.com/t/',
    pathPrefix: '',
    pathPrefixToSanitize: '',
    allowedHostnames: [],
    externalLinkAllowList: {},
    eventPrefix: 'subscriptionsupport_',
    buttonSelector: 'button', // CSS selector for buttons to track (supports any valid CSS selector)
    trackButtonText: true, // Whether to include button text in pixel
    trackButtonId: true, // Whether to include button ID in pixel
    trackButtonClass: true, // Whether to include button class in pixel
    maxButtonTextLength: 100, // Maximum length of button text to send
  };

  // Get configuration from window.PIXEL_CONFIG or use defaults
  let config = window.PIXEL_CONFIG || defaultConfig;

  // Merge with defaults to ensure all properties exist
  config = Object.assign({}, defaultConfig, config);

  const hasFired = {}; // Fire pixels only once

  /**
   * Initialize pixel tracking with custom configuration
   * @param {Object} customConfig - Configuration object
   */
  window.initPixelTracking = function (customConfig) {
    config = Object.assign({}, defaultConfig, customConfig);
    // Re-initialize event listeners with new config
    setupEventListeners();
  };

  /**
   * Manually fire a pixel event for custom tracking
   * Use this to track script loads, callbacks, or any custom events
   *
   * @param {string} eventName - Name of the event (e.g., "script-loaded", "video-played")
   * @param {Object} extraData - Optional additional data to send as query parameters
   *
   * @example
   * // Fire a simple event
   * window.firePixelEvent("script-loaded");
   *
   * @example
   * // Fire an event with data
   * window.firePixelEvent("script-loaded", { "script-name": "analytics", "version": "1.0" });
   *
   * @example
   * // Fire an event in a callback
   * someAsyncFunction().then(function() {
   *   window.firePixelEvent("async-complete", { "duration": "500ms" });
   * });
   */
  window.firePixelEvent = function (eventName, extraData) {
    if (!eventName || typeof eventName !== 'string') {
      console.warn('firePixelEvent: eventName must be a non-empty string');

      return;
    }

    firePixel(sanitize(eventName), extraData || {});
  };

  /**
   * Fires an error pixel for the provided page. If `maybeErr` is an instance of
   * the JS Error class, its message is used directly. Otherwise, `maybeErr` is
   * `JSON.stringify`'d with a bit of explanatory text that it was invalid.
   *
   * @param {Error | unknown} - maybeErr - the JavaScript Error instance to
   * retrieve a message from, or a value to be JSON serialized and included in
   * an explanatory message.
   */
  window.fireJse = function (maybeErr) {
    const err =
      maybeErr instanceof Error
        ? maybeErr
        : new Error(
            `Attempted to fire error pixel with non-Error value: ${JSON.stringify(
              maybeErr,
            )}`,
          );

    firePixel('static-err', {
      msg: err.message,
      cause: '',
      page: location.pathname,
    });
  };

  /**
   * Fires the pixel
   * @param {string} event - Event name (e.g., "load", "click")
   * @param {Object} extraData - Additional data to send as query parameters
   */
  function firePixel(event, extraData) {
    let pathname = location.pathname;

    // Strip configured path prefix if present
    if (config.pathPrefix && pathname.startsWith(config.pathPrefix)) {
      pathname = pathname.replace(
        new RegExp(
          '^' + config.pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
        '',
      );
    }

    // Remove wrapping slashes if present
    pathname = pathname.replace(/^\/?(.*)\/?$/, '$1');

    // Replace slashes with dashes
    pathname = pathname.replace(/\//g, '-');

    const sanitizedPath = sanitize(
      pathname === '/' || pathname === '' ? 'home' : pathname,
    );

    const basePixelUrl = config.baseUrl + config.eventPrefix + sanitizedPath;

    extraData = extraData || {};

    let pixelUrl = basePixelUrl + '_' + event;
    let extraDataString = '';

    Object.keys(extraData).forEach(function (extraDataKey) {
      extraDataString =
        extraDataString +
        (extraDataString === '' ? '?' : '&') +
        encodeURIComponent(sanitize(extraDataKey)) +
        '=' +
        encodeURIComponent(sanitize(extraData[extraDataKey]));
    });

    pixelUrl = pixelUrl + extraDataString;

    if (hasFired[pixelUrl]) {
      return;
    }

    hasFired[pixelUrl] = true;

    if ('sendBeacon' in navigator) {
      // https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
      navigator.sendBeacon(pixelUrl);
    } else {
      // sendBeacon fallback: img tag
      const pixel = document.createElement('img');
      pixel.setAttribute('src', pixelUrl);
    }
  }

  /**
   * Sanitizes a string for use in URLs
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  function sanitize(str) {
    const sanitized = str
      // strip leading/trailing slash
      .replace(/^\/|\/$/, '')
      // strip unsafe chars
      .replace(/[^a-z0-9_-]+/gi, '-')
      // strip configured prefix if present
      .replace(
        new RegExp(
          '^' +
            config.pathPrefixToSanitize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
        '',
      )
      // strip underscores as well
      .replace(/_/g, '-');

    return sanitized;
  }

  /**
   * Sets up event listeners for page loads, link clicks, and button clicks
   */
  function setupEventListeners() {
    // Add event listener on the document to trigger load pixel
    // This is required because SPAs (like Next.js App Router) only do soft navigation
    document.addEventListener('pageLoaded', function () {
      firePixel('load');
    });

    // // Use event delegation for links and buttons to support dynamically added content
    // // This ensures buttons/links added after page load are still tracked
    //
    // // Link clicks: Fire when links within the article are clicked
    // document.addEventListener('click', function (e) {
    //   const link = e.target.closest('article a');
    //   if (link) {
    //     handleLinkClick({ currentTarget: link });
    //   }
    // });

    // Button clicks: Fire when buttons matching the selector are clicked
    // Uses event delegation to support dynamically added buttons
    document.addEventListener('click', function (e) {
      // Check if the clicked element or any ancestor matches the selector
      let element = e.target;

      while (element && element !== document) {
        if (element.matches && element.matches(config.buttonSelector)) {
          handleButtonClick({ currentTarget: element });

          break;
        }

        element = element.parentElement;
      }
    });
  }

  // /**
  //  * Handles link click events
  //  * @param {Event} e - Click event
  //  */
  // function handleLinkClick(e) {
  //   const link = e.currentTarget;
  //   const href = link.href;
  //   const hostname = link.hostname;
  //
  //   const isInternalLink = hostname === location.hostname;
  //   const isAllowedHostname = config.allowedHostnames.indexOf(hostname) !== -1;
  //   const isAllowedExternalLink = config.externalLinkAllowList[href] === true;
  //
  //   if (isInternalLink || isAllowedHostname || isAllowedExternalLink) {
  //     // internal link clicks and allow-listed external links can send the href
  //     firePixel('click', { 'link-url': href });
  //   } else {
  //     // otherwise we don't send the href but fire a click pixel for measuring engagement
  //     firePixel('click');
  //   }
  // }

  /**
   * Handles button click events
   * @param {Event} e - Click event
   */
  function handleButtonClick(e) {
    const button = e.currentTarget;
    const buttonData = {};

    if (config.trackButtonText !== false) {
      const buttonText = button.textContent.trim();

      if (buttonText) {
        buttonData['button-text'] = buttonText.substring(
          0,
          config.maxButtonTextLength || 100,
        );
      }
    }

    if (config.trackButtonId !== false) {
      const buttonId = button.id;

      if (buttonId) {
        buttonData['button-id'] = buttonId;
      }
    }

    if (config.trackButtonClass !== false) {
      const buttonClass = button.className;

      if (buttonClass) {
        // Get first class to avoid long strings
        const firstClass = buttonClass.split(/\s+/)[0];

        if (firstClass) {
          buttonData['button-class'] = firstClass;
        }
      }
    }

    firePixel('button-click', buttonData);
  }

  // Initialize event listeners
  setupEventListeners();

  // Signal that the script is ready
  if (typeof window !== 'undefined') {
    window.pixelsScriptReady = true;
  }
});
