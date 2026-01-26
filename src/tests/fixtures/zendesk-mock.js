/**
 * Realistic Zendesk Web Widget Mock
 *
 * This mock simulates the actual Zendesk widget behavior:
 * - Creates iframe structure matching Zendesk's DOM
 * - Implements zE() API for messenger commands
 * - Simulates widget rendering in embedded mode
 * - Provides realistic content for hook testing
 */

(function () {
  'use strict';

  const callbacks = {
    unreadMessages: [],
  };

  let isRendered = false;
  let webWidgetIframe = null;
  let messagingIframe = null;

  /**
   * Create the Zendesk iframe structure
   */
  function createIframeStructure(targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) {
      console.error(`Container element #${targetElementId} not found`);
      return;
    }

    // Create web widget iframe
    webWidgetIframe = document.createElement('iframe');
    webWidgetIframe.setAttribute('data-product', 'web_widget');

    // Create messaging iframe (contains actual content)
    messagingIframe = document.createElement('iframe');
    messagingIframe.id = 'zendesk-messaging-iframe';

    container.appendChild(webWidgetIframe);
    container.appendChild(messagingIframe);

    // Wait for iframe to be ready, then populate with content
    setTimeout(() => {
      populateMessagingIframe();
    }, 100);
  }

  /**
   * Populate the messaging iframe
   */
  function populateMessagingIframe() {
    if (!messagingIframe) return;

    const iframeDoc =
      messagingIframe.contentDocument || messagingIframe.contentWindow.document;

    if (!iframeDoc) return;

    // Load the realistic iframe content (pre-href swap)
    const realisticContent = `<!DOCTYPE html>
<html dir="ltr" lang="en-us">
<head>
  <style data-styled="" data-styled-version="4.4.1"></style>
</head>
<body>
  <div>
    <div>
      <div>
        <div role="presentation">
          <div role="dialog" aria-label="Messaging window">
            <div>
              <div>
                <div role="log" tabindex="0" aria-live="polite">

                  <!-- Bot greeting -->
                  <div>
                    <div>
                      <span>DDG Subscriptions Support says: </span>
                      <span>Hi there! 👋️ I am DuckDuckGo's Subscription support agent. How can I help?</span>
                    </div>
                  </div>

                  <!-- Article cards with ORIGINAL Zendesk URLs -->
                  <div data-slide-message="true">
                    <div data-slides="true">

                      <!-- Article 1: Subscribing Outside the United States -->
                      <div>
                        <h3>Subscribing Outside the United States</h3>
                        <a aria-label="View article: 'Subscribing Outside the United States'"
                           href="https://duckduckgo-85720.zendesk.com/hc/en-us/articles/44195025991699-Subscribing-Outside-the-United-States"
                           target="_blank"
                           rel="noopener noreferrer">
                          <span>View article</span>
                        </a>
                      </div>

                      <!-- Article 2: Getting Started -->
                      <div>
                        <h3>Getting Started With The DuckDuckGo Subscription</h3>
                        <a aria-label="View article: 'Getting Started With The DuckDuckGo Subscription'"
                           href="https://duckduckgo-85720.zendesk.com/hc/en-us/articles/44195037080467-Getting-Started-With-The-DuckDuckGo-Subscription"
                           target="_blank"
                           rel="noopener noreferrer">
                          <span>View article</span>
                        </a>
                      </div>

                      <!-- Article 3: I Lost My Device -->
                      <div>
                        <h3>I Lost My Device</h3>
                        <a aria-label="View article: 'I Lost My Device'"
                           href="https://duckduckgo-85720.zendesk.com/hc/en-us/articles/44195025522323-i-lost-my-device"
                           target="_blank"
                           rel="noopener noreferrer">
                          <span>View article</span>
                        </a>
                      </div>

                    </div>
                  </div>

                  <!-- Yes/No feedback buttons -->
                  <div>
                    <div>Was this helpful?</div>
                    <ul>
                      <li><button type="button">Yes</button></li>
                      <li><button type="button">No</button></li>
                    </ul>
                  </div>

                </div>
              </div>

              <!-- Composer -->
              <div>
                <div>
                  <textarea id="composer-input"
                            rows="1"
                            placeholder="Type a message"
                            style="height: 40px;"></textarea>
                  <button data-garden-id="buttons.icon_button"
                          title="Send message"
                          type="button"
                          style="display: none;">
                    Send
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Show send button when user types
    const textarea = document.getElementById('composer-input');
    const sendButton = document.querySelector('button[title="Send message"]');

    if (textarea && sendButton) {
      textarea.addEventListener('input', () => {
        if (textarea.value.trim().length > 0) {
          sendButton.style.display = 'inline-block';
        } else {
          sendButton.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    iframeDoc.open();
    iframeDoc.write(realisticContent);
    iframeDoc.close();

    // Simulate initial load complete - trigger unreadMessages callback with
    // count=0
    setTimeout(() => {
      triggerCallback('unreadMessages', 0);
    }, 200);
  }

  /**
   * Trigger registered callbacks
   */
  function triggerCallback(event, ...args) {
    const eventCallbacks = callbacks[event] || [];

    eventCallbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * Mock zE function - implements Zendesk Web Widget API
   */
  window.zE = function (command, action, ...args) {
    console.log('[Zendesk Mock] zE called:', command, action, args);

    // Handle messenger commands
    if (command === 'messenger') {
      if (action === 'render') {
        const options = args[0] || {};
        // Support both options.targetElement and options.widget.targetElement
        let targetElementId =
          options.widget?.targetElement || options.targetElement;

        // Remove leading # if present
        if (targetElementId && targetElementId.startsWith('#')) {
          targetElementId = targetElementId.slice(1);
        }

        if (targetElementId && !isRendered) {
          isRendered = true;
          createIframeStructure(targetElementId);
          console.log(`[Zendesk Mock] Widget rendered in #${targetElementId}`);
        }
      } else if (action === 'open') {
        console.log('[Zendesk Mock] Widget opened');
      } else if (action === 'close') {
        console.log('[Zendesk Mock] Widget closed');
      }
    }

    // Handle messenger:set commands
    if (command === 'messenger:set') {
      console.log(`[Zendesk Mock] Setting ${action}:`, args[0]);
    }

    // Handle messenger:on commands (callbacks)
    if (command === 'messenger:on') {
      const event = action;
      const callback = args[0];

      if (typeof callback === 'function') {
        if (!callbacks[event]) {
          callbacks[event] = [];
        }
        callbacks[event].push(callback);
        console.log(`[Zendesk Mock] Registered callback for ${event}`);

        // If widget is already rendered and this is unreadMessages, trigger immediately
        if (event === 'unreadMessages' && isRendered) {
          // eslint-disable-next-line n/no-callback-literal
          setTimeout(() => callback(0), 100);
        }
      }
    }
  };

  // Expose helper for tests to trigger callbacks
  window.__zendeskMock = {
    triggerCallback,
    getMessagingIframe: () => messagingIframe,
    isRendered: () => isRendered,
  };

  console.log('[Zendesk Mock] Loaded successfully');
})();
