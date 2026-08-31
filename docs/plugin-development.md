# Plugin Development Guide

The system supports two plugin shapes. Pick by need:

| | Uploaded plugin (declarative) | Builtin plugin (code-level) |
|---|---|---|
| Use case | External service integration, entry buttons, embedded pages | Deep features (forms, review flows, database writes) |
| How to build | A single `manifest.json`, uploaded in the admin panel | TypeScript + React, shipped with the repo |
| Capability | Four injection shapes (button / link / iframe / markdown) + webhooks | Full (server actions, data fields) |
| Security model | Zero code execution; manifest validated by zod | Merged after code review |

Both shapes are managed at `/admin/plugins`. Disabling a plugin hides its UI entries and rejects its backend capabilities while keeping all business data.

---

## 1. Uploaded plugins (declarative manifest)

An uploaded plugin is pure declarative data: the system renders UI and forwards webhooks per the manifest, and **never executes code from the upload**.

### 1.1 Manifest format

```json
{
  "id": "my-promo",
  "name": "Promo Assistant",
  "description": "Shows a campaign entry in the header",
  "version": "1.0.0",
  "author": "your-name",
  "icon": "https://example.com/icon.png",
  "slots": {
    "header": {
      "type": "iframe",
      "label": "Campaign Center",
      "target": "https://example.com/promo",
      "width": 880,
      "height": 640
    },
    "footer": {
      "type": "link",
      "label": "About Us",
      "target": "https://example.com/about"
    }
  },
  "webhooks": {
    "siteSubmitted": "https://example.com/hooks/site-submitted"
  },
  "configFields": [
    {
      "key": "apiToken",
      "labelKey": "Service Token",
      "type": "string",
      "defaultValue": ""
    }
  ]
}
```

### 1.2 Field constraints

| Field | Constraint |
|-------|------------|
| `id` | lowercase alphanumerics/hyphen, 2-64 chars; uploads conflicting with builtin IDs are rejected |
| `name` | 1-64 chars |
| `version` | 1-32 chars |
| `description` / `author` | optional, max 256 / 64 chars |
| `icon` | optional, http(s) URL |
| `slots` | optional; at least one slot or webhook required |
| `webhooks` | optional; event name → http(s) URL |
| `configFields` | optional, max 20; `key` starts with a letter |
| File size | whole manifest max 64KB |

### 1.3 Slots

Four shapes per slot:

- **`button`**: header icon button, opens `target` in a new window
- **`link`**: text link (footer friendly), opens `target` in a new window
- **`iframe`**: icon opens a controlled dialog embedding `target`. Forced `sandbox="allow-scripts allow-forms allow-popups"` (no `allow-same-origin`, so the plugin page cannot touch host cookies/DOM); `height` optional 200-1280
- **`markdown`**: renders `content` markdown (max 8KB), footer slots only

`button` / `link` require `target` plus at least one of `label` / `icon`.

### 1.4 Webhook events

Keys in `manifest.webhooks` must come from the core event list; typos are rejected at upload validation:

| Event | Fired when | Payload fields |
|------|------------|----------------|
| `siteSubmitted` | A visitor submission succeeds (site-submission plugin) | name, url, description |
| `sitePublished` | A site is created as published, or toggled from unpublished to published | siteId, name, url, description |
| `siteUnpublished` | A site is toggled from published to unpublished | siteId, name, url, description |
| `siteDeleted` | A site is deleted | siteId, name, url, description |

The system POSTs JSON to the declared endpoint (example `sitePublished`):

```json
{
  "event": "sitePublished",
  "pluginId": "my-plugin",
  "payload": {
    "siteId": "clx...",
    "name": "Site name",
    "url": "https://example.com",
    "description": "Site description"
  }
}
```

5s timeout; failures are logged only and never block the main flow. Events are awaited synchronously — plugin endpoints should return fast (persist/enqueue first, process asynchronously).

### 1.5 Config fields

- `type`: `"number" | "string" | "boolean"`
- `labelKey`: display label for uploaded plugins (plain text, no i18n)
- `defaultValue`: used when the admin has not configured a value; numbers support `min` / `max`

Config values persist independently of the enabled state and take effect on the next render after enabling.

### 1.6 Upload and lifecycle

1. Admin panel → Plugins → choose your `manifest.json`
2. Validation failures are reported field by field; valid manifests land in a **disabled** state
3. Toggle to enable; uploaded plugins can be deleted anytime (business data preserved), builtin plugins can only be toggled

---

## 2. Builtin plugins (code-level)

Deep features ship as builtin plugins. Use `plugins/site-submission` (site submission) as the reference implementation.

### 2.1 Directory layout

```
plugins/<your-plugin>/
  index.ts          # plugin definition (single entry)
  constants.ts      # PLUGIN_ID, config field declarations, webhook event names
  actions.ts        # "use server": plugin server actions
  header-slot.tsx   # optional: "use client", header injection component
```

### 2.2 Plugin definition (index.ts)

```ts
import { Puzzle } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { MyHeaderSlot } from "./header-slot"
import { PLUGIN_ID, MY_CONFIG_FIELDS } from "./constants"

export const myPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.myPlugin.name",
  descriptionKey: "plugins.myPlugin.description",
  icon: Puzzle,
  version: "1.0.0",
  defaultEnabled: false,
  configFields: MY_CONFIG_FIELDS,
  headerSlot: MyHeaderSlot,
  footerSlot: MyFooterSlot,
  serverActionIds: ["myAction"],
}
```

### 2.3 Register it

```ts
// lib/plugins/registry.ts
export const pluginRegistry: PluginDefinition[] = [
  siteSubmissionPlugin,
  myPlugin,   // one line
]
```

Zero core changes: header/footer slots and the admin page discover the new plugin automatically.

### 2.3a Available injection slots

| Slot field | Position | Typical use |
|-----------|----------|-------------|
| `headerSlot` | Frontend header toolbar | Feature entries (submission button) |
| `headerToolsSlot` | Frontend header toolbar (toggle position) | User-level visibility toggles (poetry button) |
| `homeSideSlot` | Homepage right-side floating panel | Floating cards (daily poetry) |
| `footerSlot` | Footer | Links / markdown blocks |

`homeSideSlot` works with the visibility protocol:

- `useBuiltinPluginEnabled(id)`: whether a plugin is enabled
- `useHomeSideActive()`: whether any homeSide plugin is enabled (core reserves right-side space accordingly)
- `useHomeSideVisible(enabled)`: user-level visibility (localStorage + custom event), returns `{ visible, mounted, setUserVisible }`

Multiple plugins may register for a slot; by product convention only one homeSide card shows at a time.

### 2.3b Builtin plugin inventory

| Plugin ID | Feature | Status |
|---------|------|----------|
| `site-submission` | Visitor website submission with admin review | Pluginized |
| `poetry-card` | Daily poetry card on the homepage | Pluginized |
| `visit-tracking` | Visit tracking + admin visit statistics | Pluginized |
| `site-detail` | Secondary detail dialog on site cards | Pluginized (data fetching `getSiteDetail` stays core; dialog UI belongs to the plugin) |
| `about-page` | Frontend About page entry (footer link + sitemap) | Pluginized (content stays in SystemSettings with workspace overrides) |

### 2.4 Backend capabilities (actions.ts)

```ts
"use server"

import { assertPluginEnabled, getPluginConfig } from "@/lib/plugins/runtime"
import { PluginDisabledError } from "@/lib/plugins/types"
import { PLUGIN_ID, MY_CONFIG_FIELDS } from "./constants"

export async function myAction(data: { /* ... */ }) {
  try {
    await assertPluginEnabled(PLUGIN_ID)
  } catch (error) {
    if (error instanceof PluginDisabledError) {
      return { success: false, code: "PLUGIN_DISABLED" }
    }
    throw error
  }

  const config = await getPluginConfig(PLUGIN_ID, MY_CONFIG_FIELDS)

  // ...business logic
}
```

Key rules:

- **Guard is mandatory**: actions are directly callable by clients; `assertPluginEnabled` is the only line of defense for the disabled state
- **Error codes, not prose**: actions return `code`; the client maps codes to localized text (see site-submission `errors.*`)
- Always re-validate client input on the server (zod schemas can be bypassed)

### 2.5 Frontend injection (header-slot.tsx)

Slot components take no props and fetch their own data (see `plugins/site-submission/header-slot.tsx`: categories load lazily when the dialog opens).

### 2.6 i18n

Add a `plugins.<yourPlugin>` namespace to all six `messages/*.json` files:

```json
{
  "plugins": {
    "myPlugin": {
      "name": "Plugin name",
      "description": "Plugin description",
      "config": { "someField": "Config label" }
    }
  }
}
```

### 2.7 Database (only when necessary)

Prefer reusing core models (e.g. Site). When a new table is truly required:

- Add the model to `prisma/schema.prisma` (the postgresql master file — the SQLite variant is regenerated by `scripts/sync-schemas.mjs`)
- Add a migration `prisma/migrations/<ts>_<name>/migration.sql` (PostgreSQL; SQLite side syncs via `prisma db push` on startup)
- Run `npm install` (postinstall regenerates both Prisma clients via `scripts/generate-prisma.mjs`)

---

## 3. Semantics

1. **Disable ≠ delete**: disabling keeps all business data; re-enabling restores everything
2. **Default disabled**: all plugins start disabled on fresh installs and upgrades
3. **Global scope**: toggles are site-wide; per-workspace enablement is future work
4. **Zero core coupling**: core pages only know the registry and injection slots; removing a plugin directory plus one registry line decommissions it completely
