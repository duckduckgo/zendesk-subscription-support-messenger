# Zendesk Integration Hooks

This directory contains React hooks for integrating with the Zendesk Web Widget messaging interface. These hooks handle iframe interactions, DOM manipulation, and anonymous event logging within the embedded Zendesk widget.

## Hooks

### `useZendeskSwapArticleLinks`

Swaps Zendesk private article link URLs with public help page URLs. Processes links when the widget becomes ready and listens for new messages via the `unreadMessages` callback.

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
- Uses coordinated retry system with operation type `'link-swapping'` to handle timing issues
- Maps Zendesk article IDs to help page paths via `ARTICLE_LINK_MAP`. This map was manually created but will be automated in future iterations

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
- Uses coordinated retry system with operation type `'style-injection'` to handle timing issues
- Retries can be cancelled via `retryManager.cancelRetry('style-injection')` when widget becomes unavailable

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

## Retry Manager Utilities

The hooks use utilities from `@/utils/zendesk-retry-manager` to coordinate retry operations:

### `createRetryManager()`

Creates a new `RetryManager` instance. Each hook should create its own instance to track its retries:

```tsx
const retryManagerRef = useRef(createRetryManager());
```

### `scheduleCoordinatedRetry()`

Schedules a retry operation with automatic coordination and lifecycle management:

```tsx
scheduleCoordinatedRetry(
  retryManager,
  'link-swapping', // Operation type
  () => {
    // Retry callback — return value is not used by the manager
    processLinks();
  },
  isMountedRef,
  retriesRemaining,
  delay,
);
```

This function:

- Returns `null` immediately if `retriesRemaining <= 0`
- Creates a `shouldRetry` callback that checks mount state
- Schedules the retry with coordination (cancels existing retries for the same operation type)
- Returns a cleanup function to cancel the retry, or `null` if the retry was not scheduled

**Important:** The manager is a single-shot scheduler — each call schedules exactly one deferred callback. It does not auto-retry. The callback itself is responsible for calling `scheduleCoordinatedRetry` again with a decremented retry count if the operation still fails. This recursive pattern is how multi-attempt retry sequences are built.

### `markComponentMounted()`

Marks a component as mounted and notifies the retry manager:

```tsx
markComponentMounted(isMountedRef, retryManager);
```

This sets `isMountedRef.current = true` and calls `retryManager.setMounted()`.

### `markComponentUnmounted()`

Marks a component as unmounted and cancels all active retries:

```tsx
markComponentUnmounted(isMountedRef, retryManager);
```

This sets `isMountedRef.current = false` and calls `retryManager.setUnmounted()`, which cancels all active retries.

### Operation Types

Retries are categorized by operation type to enable coordination. Only one retry per operation type can be active at a time. Scheduling a new retry for an operation type will cancel any existing retry for that type.

- **`'style-injection'`** - Used by `useZendeskIframeStyles` when injecting CSS styles
- **`'link-swapping'`** - Used by `useZendeskSwapArticleLinks` when swapping article links
- **`'iframe-access'`** - Available for iframe access operations (not currently used)
- **`'observer-setup'`** - Defined but not currently used; observer setup retries are handled internally by `setupZendeskObserver` via its `retryOnNotReady` option

---

## Common Patterns

### Mounted State Tracking

All Zendesk hooks use `isMountedRef` to prevent race conditions and memory leaks. Hooks that use the retry manager (`useZendeskIframeStyles`, `useZendeskSwapArticleLinks`) also use the `markComponentMounted`/`markComponentUnmounted` helpers to keep the retry manager in sync. `useZendeskClickHandlers` manages `isMountedRef` directly since it does not use the retry manager. This solves several critical problems:

**Why Track Unmounting in a Single Page Application?**

In a typical single page application, the main page component shouldn't normally unmount. However, mount tracking is still essential because:

- **React Strict Mode**: In development, React Strict Mode intentionally mounts, unmounts, and remounts components to help detect side effects. Without mount tracking, retries scheduled during the first mount could execute after the remount, causing duplicate operations.

- **Hot Module Reloading (HMR)**: During development, HMR can cause components to remount when code changes, potentially leaving stale retries from the previous mount active.

- **Error Recovery**: If an error boundary catches an error and remounts the component, or if the Zendesk widget is reset (via the "Clear conversation" feature), the component may remount, leaving previous retries active.

- **Future-Proofing**: Even if the current architecture doesn't involve unmounting, future changes (route restructuring, component splitting, etc.) could introduce unmounting scenarios. Mount tracking ensures the code remains robust.

- **Widget Reset Scenarios**: When the Zendesk widget is reset (burn animation feature), the component state is reset but the component itself may not unmount. Mount tracking helps ensure retries from before the reset don't interfere with new operations.

**Problems Solved:**

1. **Race Conditions with Async Operations**: When a component unmounts (or resets), there may be pending timeouts, retries, or async operations (like accessing iframes) that could still execute. Without mount tracking, these operations could:
   - Access DOM elements that no longer exist (causing errors)
   - Update state on unmounted components (React warnings)
   - Execute callbacks that reference stale closures

2. **Memory Leaks**: Without proper cleanup, timeouts and retries could continue running indefinitely after unmount, holding references to components and preventing garbage collection.

3. **Stale Closures**: Callbacks scheduled via `setTimeout` or retry mechanisms might execute after the component has unmounted, accessing stale state or trying to update unmounted components.

4. **Multiple Retry Attempts**: Without coordination, multiple retry attempts could be scheduled and execute even after the component unmounts, wasting resources and potentially causing errors.

**Implementation:**

```tsx
const isMountedRef = useRef(true);
const retryManagerRef = useRef(createRetryManager());

useEffect(() => {
  const retryManager = retryManagerRef.current;

  // Mark component as mounted and notify retry manager
  markComponentMounted(isMountedRef, retryManager);

  // All async operations check isMountedRef.current before executing
  // Example: if (!isMountedRef.current) return;

  return () => {
    // Mark component as unmounted and cancel all retries
    markComponentUnmounted(isMountedRef, retryManager);
  };
}, [dependencies]);
```

**How It Works:**

- Before any async operation (DOM access, retry callbacks, timeouts), hooks check `isMountedRef.current`
- If the component has unmounted, operations return early without executing
- The retry manager is notified of mount/unmount state and cancels all active retries on unmount
- This prevents operations from executing after component cleanup, eliminating race conditions and memory leaks

### Coordinated Retry System

The retry manager coordinates retries across hooks to prevent race conditions by:

- Preventing conflicts: Only one retry per operation type can be active at a time
- Tracking by operation type: Avoids duplicate work across hooks
- Handling lifecycle: Automatically cancels retries when components unmount
- Debouncing: Cancels existing retries when new ones are scheduled for the same operation type

### MutationObserver Usage

Hooks use `setupZendeskObserver` utility to watch for DOM changes:

- `useZendeskClickHandlers` - Re-attaches handlers on mutations
- `useZendeskIframeStyles` - Re-injects styles when iframe reloads
- `useZendeskSwapArticleLinks` - Not used (relies on `unreadMessages` callback)

**Note**: `setupZendeskObserver` has its own retry logic (via `retryOnNotReady` option) that is separate from the coordinated retry manager system. The retry manager handles retries for style injection and link swapping operations.
