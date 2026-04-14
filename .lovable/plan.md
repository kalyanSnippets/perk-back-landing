

## Configure Google Wallet Secrets

### Steps
1. **Store `GOOGLE_WALLET_SERVICE_ACCOUNT`** — Save the uploaded JSON key content as a backend secret using the `add_secret` tool
2. **Store `GOOGLE_WALLET_ISSUER_ID`** — Request your Issuer ID (the numeric string from the Google Pay & Wallet Console) and save it as a secret
3. **Deploy edge functions** — Redeploy `google-wallet-pass` and `update-wallet-pass` so they pick up the new secrets
4. **Test** — Call the `google-wallet-pass` edge function to verify it works

### What I Need From You
- Your **Issuer ID** from the Google Pay & Wallet Console (numeric string at the top of the page, e.g. `3388000000012345678`)

### Technical Details
- The JSON key will be stored as `GOOGLE_WALLET_SERVICE_ACCOUNT` (the entire file contents as a single string)
- The Issuer ID will be stored as `GOOGLE_WALLET_ISSUER_ID`
- Both are used by the `google-wallet-pass` and `update-wallet-pass` edge functions to sign and manage loyalty passes

