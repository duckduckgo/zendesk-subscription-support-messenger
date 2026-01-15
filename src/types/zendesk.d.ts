/// <reference types="zendesk-web-widget" />

/**
 * Extended type definitions for Zendesk Web Widget API
 * Extends @types/zendesk-web-widget with additional methods for customization and embedded mode
 */

declare global {
  interface Window {
    /**
     * Indicates that the pixels.js script has loaded and is ready.
     * Set by pixels.js after initializing event listeners.
     */
    pixelsScriptReady?: boolean;
    /**
     * Manually fire a pixel event for custom tracking.
     * @param eventName - Name of the event (e.g., "button-click", "custom-action")
     * @param extraData - Optional additional data to send as query parameters
     */
    firePixelEvent?: (
      eventName: string,
      extraData?: Record<string, string>,
    ) => void;
    /**
     * Fires an error pixel for the provided page. If `maybeErr` is an instance of
     * the JS Error class, its message is used directly. Otherwise, `maybeErr` is
     * JSON.stringify'd with a bit of explanatory text that it was invalid.
     * @param maybeErr - The JavaScript Error instance to retrieve a message from,
     *                   or a value to be JSON serialized and included in an
     *                   explanatory message.
     */
    fireJse?: (maybeErr: Error | unknown) => void;
    /**
     * Callback function called when the theme changes.
     * Used by Zendesk widget to update its theme.
     * @param theme - The new theme value ('light' or 'dark')
     */
    onThemeUpdate?: (theme: string) => void;
  }

  /**
   * Sets customization options for the messaging Web Widget.
   * @see https://developer.zendesk.com/api-reference/widget-messaging/web/core/#set-customization
   */
  function zE(
    scope: 'messenger:set',
    method: 'customization',
    value: {
      common?: {
        hideHeader?: boolean;
        hideLauncher?: boolean;
        hideCloseButton?: boolean;
        position?: 'left' | 'right';
        offset?: {
          horizontal?: string;
          vertical?: string;
        };
      };
      launcher?: {
        label?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        chatLabel?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        zIndex?: number;
      };
      chat?: {
        title?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        subtitle?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        connectButton?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        prechatForm?: {
          greeting?: {
            'en-US'?: string;
            [locale: string]: string | undefined;
          };
        };
        agent?: {
          avatarPath?: string;
        };
        bot?: {
          avatarPath?: string;
        };
      };
      conversationList?: {
        title?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
        emptyState?: {
          'en-US'?: string;
          [locale: string]: string | undefined;
        };
      };
      theme?: {
        primary?: string;
        onPrimary?: string;
        message?: string;
        onMessage?: string;
        action?: string;
        onAction?: string;
        businessMessage?: string;
        onBusinessMessage?: string;
        background?: string;
        onBackground?: string;
        error?: string;
        onError?: string;
        notify?: string;
        onNotify?: string;
      };
    },
  ): void;

  /**
   * Renders the messaging Web Widget in embedded mode.
   * @see https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/web/embedded-mode/
   */
  function zE(
    scope: 'messenger',
    method: 'render',
    options: {
      mode: 'embedded';
      widget?: {
        targetElement: string;
      };
      conversationList?: {
        targetElement: string;
      };
      messageLog?: {
        targetElement: string;
      };
    },
  ): void;
}

export {};
