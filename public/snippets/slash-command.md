---
description: Save a secret to KeyVault Sidekick via the prefill URL
allowed-tools: Bash
---

Save a secret to KeyVault Sidekick.

Arguments from the user: $ARGUMENTS

Expected format: <KEY_NAME> <VALUE> [type] [project]

Example: `/keyvault-save STRIPE_API_KEY sk_live_xxx api_key "ITIL Sidekick"`

Steps:
1. Parse $ARGUMENTS. The KEY_NAME and VALUE are required. type defaults
   to 'api_key'. project, if provided, may be quoted with spaces inside.
2. If KEY_NAME or VALUE is missing, ask the user.
3. URL-encode each component.
4. Build the URL:
   https://keyvault-sidekick.pages.dev/app.html#action=prefill&name=<N>&value=<V>&type=<T>&project=<P>
5. Open in default browser via Bash:
     start "" "<URL>"     # Windows
     open "<URL>"         # macOS
     xdg-open "<URL>"     # Linux
6. Confirm to the user: "Opening KeyVault — review and click Save key."

No sign-in needed — the URL opens the vault directly. The user just needs
their vault unlocked (master password) for the prefill modal to appear.
