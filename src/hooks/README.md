# Zendesk Integration Hooks

This directory contains React hooks for integrating with the Zendesk Web Widget messaging interface. These hooks handle iframe interactions, DOM manipulation, and anonymous event logging within the embedded Zendesk widget.

## Hooks

### `useZendeskSwapArticleLinks`

Swaps Zendesk article link URLs with custom help page URLs. Processes links when the widget becomes ready and listens for new messages via the `unreadMessages` callback.

**Usage:**

```tsx
useZendeskSwapArticleLinks({
  zendeskReady,
});
```

**Key Features:**

- Processes existing links on initial widget load with retry logic
- Listens for new messages via `unreadMessages` callback
- Uses retry mechanism to handle timing issues where links may not be ready immediately

**Implementation Details:**

- Uses `unreadMessages` callback to detect when message content has been added to the DOM
- Retries up to `DEFAULT_MAX_RETRIES` times if links aren't found initially
- Maps Zendesk article IDs to help page paths via `ARTICLE_LINK_MAP`

---

### `useZendeskClickHandlers`

Attaches click and keyboard event handlers to Zendesk widget buttons and links. Uses event delegation at the document level to handle dynamically added elements.

**Usage:**

```tsx
useZendeskClickHandlers({
  zendeskReady,
  onButtonClick: (element, event) => {
    // Handle button clicks
  },
  onLinkClick: (element, event) => {
    // Handle link clicks
  },
});
```

**Key Features:**

- Document-level event delegation for reliable event handling
- Handles Enter key presses in textarea
- Prevents duplicate handlers using `WeakSet` tracking
- Re-attaches handlers on DOM mutations to handle iframe reloads

**Implementation Details:**

- Uses `WeakSet` to track which documents and textareas have handlers attached
- MutationObserver ensures handlers persist across iframe reloads
- Captures Enter key in `#composer-input` textarea to trigger send button handler

---

### `useZendeskIframeStyles`

Injects custom CSS styles into the Zendesk widget iframe. Re-injects styles if the iframe reloads.

**Usage:**

```tsx
useZendeskIframeStyles({
  zendeskReady,
  styles: ZENDESK_IFRAME_STYLES,
});
```

**Key Features:**

- Initial style injection when widget becomes ready
- MutationObserver watches for iframe reloads and re-injects styles
- Prevents duplicate style elements by removing existing ones before injection
- Uses retry logic to handle timing issues

**Implementation Details:**

- Removes existing style elements with `data-zendesk-custom-styles` attribute before injecting
- MutationObserver watches the `head` element for changes
- Retries up to `DEFAULT_MAX_RETRIES` times if iframe isn't ready

---

### `useMediaQuery`

General-purpose hook for responsive design. Detects viewport size changes using `window.matchMedia`.

**Usage:**

```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
```

**Semantic Hooks:**

- `useIsMobile()` - Returns true for mobile viewports
- `useIsTablet()` - Returns true for tablet viewports
- `useIsDesktop()` - Returns true for desktop viewports
- `useBreakpoints()` - Returns object with all breakpoint states

**Implementation Details:**

- Uses `addEventListener` on `MediaQueryList`
- Handles SSR by initializing state with `window.matchMedia` check
- Automatically updates when viewport size changes

---

## Common Patterns

### Mounted State Tracking

All Zendesk hooks use `isMountedRef` to prevent race conditions and memory leaks:

```tsx
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;

  // Async operations check isMountedRef.current before executing

  return () => {
    isMountedRef.current = false;
  };
}, [dependencies]);
```

### Retry Logic

Hooks use retry mechanisms to handle timing issues where the iframe or DOM elements may not be ready:

- `processArticleLinks` retries if links aren't found
- `injectStyles` retries if iframe isn't available
- `setupZendeskObserver` retries if iframe isn't ready (when `retryOnNotReady: true`)

### MutationObserver Usage

Hooks use `setupZendeskObserver` utility to watch for DOM changes:

- `useZendeskClickHandlers` - Re-attaches handlers on mutations
- `useZendeskIframeStyles` - Re-injects styles when iframe reloads
- `useZendeskSwapArticleLinks` - Not used (relies on `unreadMessages` callback)
