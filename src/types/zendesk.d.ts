/// <reference types="zendesk-web-widget" />

/**
 * Extended type definitions for Zendesk Web Widget API
 * Extends @types/zendesk-web-widget with additional methods for customization and embedded mode
 */

declare global {
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
      widget: {
        targetElement: string;
      };
      conversationList?: {
        targetElement: string;
      };
    },
  ): void;
}

export {};
