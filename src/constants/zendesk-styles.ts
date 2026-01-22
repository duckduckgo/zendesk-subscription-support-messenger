import {
  ZENDESK_BUTTON_DATA_ATTR,
  ZENDESK_INPUT_SELECTOR,
} from './zendesk-selectors';

/**
 * Custom CSS styles to inject into the Zendesk widget iframe.
 */
export const ZENDESK_IFRAME_STYLES = `
  div[role="status"] + div {
    padding: 10px 1px;
    width: 95%;
    margin: 0 auto;
  }

  ${ZENDESK_INPUT_SELECTOR} {
    border-radius: 8px;
    background-color: #FFFFFF;
  }

  ${ZENDESK_INPUT_SELECTOR} textarea,
  ${ZENDESK_INPUT_SELECTOR} textarea:active,
  ${ZENDESK_INPUT_SELECTOR} textarea:focus,
  ${ZENDESK_INPUT_SELECTOR} textarea:focus-visible,
  ${ZENDESK_INPUT_SELECTOR} textarea:focus-within {
    border: 1px solid rgb(102, 102, 102) !important;
    border-color: rgb(102, 102, 102) !important;
    outline: none !important;
    box-shadow: none !important;
  }

  ${ZENDESK_INPUT_SELECTOR}:focus-within,
  ${ZENDESK_INPUT_SELECTOR}:has(textarea:focus),
  ${ZENDESK_INPUT_SELECTOR}:has(textarea:active) {
    border: 1px solid rgb(102, 102, 102) !important;
    border-color: rgb(102, 102, 102) !important;
    box-shadow: none !important;
  }

  div[role="dialog"][aria-label="Messaging window"] {
    border: none;
    border-radius: 8px;
  }

  ul:has(button[data-garden-id="${ZENDESK_BUTTON_DATA_ATTR}"]) {
    max-width: unset;
    justify-content: center;
  }
`;
