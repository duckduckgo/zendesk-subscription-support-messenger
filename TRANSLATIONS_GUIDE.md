# Translations Guide

This guide explains how to access translations in both server and client components.

## Overview

Translations are loaded server-side in the root layout and made available through two mechanisms:

1. **Server Components**: Use `getTranslations()` or `getTranslation()` utilities
2. **Client Components**: Use `useIntl()` hook from `react-intl`

## Server Components

Server components can access translations directly using utility functions. These functions detect the locale from the `Accept-Language` header and load the appropriate translations.

### Option 1: Get All Translations

```tsx
import { getTranslations } from '@/utils';

export default async function MyServerComponent() {
  const { locale, messages } = await getTranslations();

  return (
    <div>
      <h1>{messages.homepage}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

### Option 2: Get a Specific Translation (Recommended)

```tsx
import { getTranslation } from '@/utils';

export default async function MyServerComponent() {
  const title = await getTranslation('homepage');
  const subtitle = await getTranslation('subtitle', 'Default subtitle');

  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
```

### Benefits of Server Components

- ✅ No `'use client'` directive needed
- ✅ Translations included in initial HTML (better SEO)
- ✅ Faster page loads (no client-side loading)
- ✅ Reduced JavaScript bundle size

## Client Components

Client components use the `useIntl()` hook from `react-intl`. The translations are already loaded in the layout and provided via `TranslationsProvider`.

```tsx
'use client';

import { useIntl } from 'react-intl';

export function MyClientComponent() {
  const intl = useIntl();

  return (
    <div>
      {/* Simple translation */}
      <h1>{intl.formatMessage({ id: 'homepage' })}</h1>

      {/* Translation with variables */}
      <p>{intl.formatMessage({ id: 'welcome' }, { name: 'John' })}</p>

      {/* Access locale */}
      <p>Current locale: {intl.locale}</p>
    </div>
  );
}
```

### Benefits of Client Components

- ✅ Access to `react-intl` formatting features (dates, numbers, plurals)
- ✅ Dynamic translations based on user interactions
- ✅ Can update translations without page reload

## Examples

### Homepage (Server Component)

```tsx
import { getTranslation } from '@/utils';

export default async function Home() {
  const title = await getTranslation('homepage');

  return (
    <div>
      <h1>{title}</h1>
      <ClientButton />
    </div>
  );
}
```

### Button Component (Client Component)

```tsx
'use client';

import { useIntl } from 'react-intl';
import { Button } from '@/components';

export function ClientButton() {
  const intl = useIntl();
  const buttonText = intl.formatMessage({ id: 'clickMe' });

  return <Button text={buttonText} onClick={() => alert('Clicked!')} />;
}
```

### Mixed Server/Client Component Page

```tsx
import { getTranslation } from '@/utils';
import { ClientCounter } from './ClientCounter';

export default async function Page() {
  // Server component - get translations directly
  const title = await getTranslation('pageTitle');

  return (
    <div>
      <h1>{title}</h1>
      {/* Client component uses useIntl() internally */}
      <ClientCounter />
    </div>
  );
}
```

## Translation Keys

Translation keys are defined in JSON files located in `/text/{locale}.json`:

```json
{
  "homepage": {
    "message": "AI Support Ticket Deflection",
    "description": "Homepage title",
    "namespace": "common"
  },
  "clickMe": {
    "message": "Click me",
    "description": "Button text",
    "namespace": "common"
  }
}
```

## Best Practices

1. **Use server components when possible**: Better performance and SEO
2. **Use `getTranslation()` for single translations**: More convenient than `getTranslations()`
3. **Use client components for interactive elements**: Only when you need React hooks or user interactions
4. **Provide default values**: Use the second parameter of `getTranslation()` for fallbacks
5. **Type safety**: Consider creating TypeScript types for translation keys

## Type Safety (Optional)

You can create a type for translation keys:

```tsx
type TranslationKey = 'homepage' | 'clickMe' | 'themeToggle';

export async function getTranslation(
  key: TranslationKey,
  defaultValue?: string,
): Promise<string> {
  // ... implementation
}
```

## FAQ

### Q: Can I use `useIntl()` in server components?

**A:** No. `useIntl()` is a React hook and requires a client component (`'use client'`). Use `getTranslations()` or `getTranslation()` instead.

### Q: Do I need to load translations in every server component?

**A:** No. Translations are loaded once in the layout. However, if you need translations in a server component, you can call `getTranslations()` - it's optimized and cached by Next.js.

### Q: What if a translation key is missing?

**A:** `getTranslation()` returns the key itself if no translation is found (or the default value if provided). `useIntl().formatMessage()` also returns the key as fallback.

### Q: Can I pass translations as props?

**A:** Yes! Server components can receive translations as props from parent server components. This is useful for avoiding duplicate `getTranslations()` calls.

```tsx
// Parent
export default async function Parent() {
  const translations = await getTranslations();
  return <Child translations={translations.messages} />;
}

// Child
export default function Child({
  translations,
}: {
  translations: Record<string, string>;
}) {
  return <div>{translations.homepage}</div>;
}
```
