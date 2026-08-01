# Configuration File Map

Complete mapping of all files and specific fields to modify during initialization.

## Core Config

### `src/config/site.ts`
- `name`: projectName
- `description`: generated description
- Fallback URL: `https://{domain}`

### `package.json`
- `name`: packageName (kebab-case)

## i18n Messages

### `src/messages/en.json`
- `Metadata.title` — "{projectName} - {tagline}"
- `Metadata.description` — English description
- `Showcase.title` — "Created With {projectName}"
- `FAQ.subtitle` — "Everything you need to know about {projectName}"
- `FAQ.general.answer` — product-specific
- `FAQ.support.answer` — include {supportEmail}
- `Footer.copyright` — "© {year} {projectName}"
- `SiteFooter.copyright` — same
- `SignInModal.signin_subtitle` — "Get started with {projectName}"
- `MainNav.introducing` — "Introducing {projectName}"
- `Mail.welcome.*` — brand name + URLs
- `Mail.magicLink.*` — brand name
- `Mail.resetPassword.*` — brand name
- `Emails.*` — same as Mail sections

### `src/messages/zh.json`
Same structure as en.json with Chinese content.

## Legal Pages

### `src/app/[locale]/(marketing)/privacy/page.tsx`
- `metadata.title` — "Privacy Policy - {projectName}"
- `metadata.description` — "Privacy Policy for {projectName}"
- Body: all "NovaMotion" → projectName, emails → supportEmail/privacyEmail

### `src/app/[locale]/(marketing)/terms/page.tsx`
- Same pattern as privacy

### `src/app/[locale]/(marketing)/privacy-policy/page.tsx`
- Convert to redirect to `/privacy` or delete

### `src/app/[locale]/(marketing)/terms-of-service/page.tsx`
- Convert to redirect to `/terms` or delete

## Email Templates

### `src/mail/components/email-layout.tsx`
- Brand name text in header
- Team name in footer: "{projectName} Team"

### `src/mail/templates/welcome-email.tsx`
- PreviewProps: title, body, appUrl

### `src/mail/templates/magic-link-email.tsx`
- PreviewProps: title, magicLink domain

### `src/mail/templates/reset-password-email.tsx`
- PreviewProps: body text, resetUrl domain

### `src/lib/emails/welcome-email.tsx`
- Default `appUrl` parameter → `https://{domain}`
- Brand name in email body

### `src/lib/emails/reset-password-email.tsx`
- Default `appUrl` parameter → `https://{domain}`
- Brand name in email body

## UI Components

### `src/components/landing/header.tsx`
- Logo text: 3 instances of "🎬 NovaMotion"

### `src/components/landing/footer.tsx`
- Logo text (line ~55)
- "Made with ... by {projectName} Team" (line ~92)

### `src/components/main-nav.tsx`
- Brand name div
- Remove docs link (users won't have a docs site)

### `src/components/layout/header-simple.tsx`
- Brand name span

### `src/components/site-footer.tsx`
- Logo alt text

### `src/components/landing/faq-section.tsx`
- Uses `{supportEmail}` from `useSiteSettings()` hook; hides email link when empty

### `src/components/price/pricing-cards.tsx`
- Uses `{supportEmail}` from `useSiteSettings()` hook; hides email link when empty

### `src/components/price/aceternity-pricing.tsx`
- Uses `{supportEmail}` from `useSiteSettings()` hook; hides email link when empty

### `src/components/price/creem-pricing.tsx`
- Uses `{supportEmail}` from `useSiteSettings()` hook; hides email link when empty

## SEO & Metadata

### `src/app/layout.tsx`
- `metadata.title.default` and `template`
- `metadata.description`
- `metadata.keywords[]`
- `metadata.openGraph`
- `metadata.twitter`
- `metadata.icons`

### `src/app/[locale]/(marketing)/page.tsx`
- `titles` object (en/zh)
- `descriptions` object (en/zh)

### `src/app/sitemap.ts`
- Fallback baseUrl

## Navigation & Misc

### `src/config/navigation.ts`
- Remove docs link (users won't have a docs site)

### `next.config.mjs`
- Review/remove unused image remote patterns

## LocalStorage Keys

### `src/components/landing/hero-section.tsx`
- `novamotion_pending_prompt` → `{localStoragePrefix}_pending_prompt`
- `novamotion_pending_image` → `{localStoragePrefix}_pending_image`
- `novamotion_notification_asked` → `{localStoragePrefix}_notification_asked`
- `novamotion_tool_prefill` → `{localStoragePrefix}_tool_prefill`

### `src/lib/video-task-storage.ts`
- `novamotion_video_tasks` → `{localStoragePrefix}_video_tasks`

### `src/lib/video-history-storage.ts`
- `novamotion_video_history` → `{localStoragePrefix}_video_history`

### `src/components/tool/tool-page-layout.tsx`
- `novamotion_tool_prefill` → `{localStoragePrefix}_tool_prefill`
- `novamotion_notification_asked` → `{localStoragePrefix}_notification_asked`

## Admin

### `src/app/[locale]/(admin)/admin/settings/page.tsx`
- Remove docs link (users won't have a docs site) (2 occurrences)
