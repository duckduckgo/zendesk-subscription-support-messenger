export type WidgetState = {
  /** Whether the Zendesk widget has finished initializing */
  zendeskReady: boolean;
  /** Whether the widget should be loaded (user has consented) */
  loadWidget: boolean;
  /** Whether the first message has been sent in the current session */
  firstMessageSent: boolean;
};

export type WidgetAction =
  | { type: 'SET_ZENDESK_READY' }
  | { type: 'SET_LOAD_WIDGET' }
  | { type: 'SET_FIRST_MESSAGE_SENT' }
  | { type: 'RESET_STATE' };

export const initialWidgetState: WidgetState = {
  zendeskReady: false,
  loadWidget: false,
  firstMessageSent: false,
};

/**
 * Reducer function for widget state management.
 *
 * @function widgetReducer
 * @param {WidgetState} state - Current widget state
 * @param {WidgetAction} action - Action to perform
 *
 * @returns {WidgetState} New widget state
 */
export function widgetReducer(
  state: WidgetState,
  action: WidgetAction,
): WidgetState {
  switch (action.type) {
    case 'SET_ZENDESK_READY':
      return { ...state, zendeskReady: true };
    case 'SET_LOAD_WIDGET':
      return { ...state, loadWidget: true };
    case 'SET_FIRST_MESSAGE_SENT':
      return { ...state, firstMessageSent: true };
    case 'RESET_STATE':
      return initialWidgetState;
    default:
      return state;
  }
}
