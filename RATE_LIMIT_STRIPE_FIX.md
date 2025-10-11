# Rate Limiting & Stripe Webhook Fix

## Issues Fixed

### 1. Trust Proxy Configuration Error ✅

**Problem:**
```
ValidationError: The Express 'trust proxy' setting is true, which allows anyone to 
trivially bypass IP-based rate limiting.
```

**Root Cause:**
The `trust proxy` setting was set to `true`, which is too permissive and allows IP address spoofing, making rate limiting ineffective.

**Solution:**
Changed from `app.set('trust proxy', true)` to `app.set('trust proxy', 1)` in `backend/src/index.ts`.

This tells Express that there is exactly **one proxy hop** (your Nginx Proxy Manager) between the client and the app, which is the secure configuration. Now Express will correctly extract the client's real IP from the `X-Forwarded-For` header only from the first trusted proxy.

### 2. Stripe Webhook Signature Verification Error ✅

**Problem:**
```
StripeSignatureVerificationError: Webhook payload must be provided as a string or 
a Buffer instance representing the _raw_ request body. Payload was provided as a 
parsed JavaScript object instead.
```

**Root Cause:**
The global `express.json()` middleware was parsing the request body as JSON before the Stripe webhook handler could access the raw body. Stripe requires the raw, unparsed body to verify the webhook signature.

**Solution:**
Restructured the middleware order and webhook registration:

1. **Extracted webhook handler**: Created a separate `handleStripeWebhook` function in `backend/src/routes/stripe.ts`
2. **Registered webhook BEFORE JSON parser**: Added the webhook route with raw body parser before the global JSON middleware in `backend/src/index.ts`:
   ```typescript
   app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);
   ```
3. **Then registered JSON parser**: All other routes continue to use the JSON parser as normal

This ensures:
- The webhook route receives the raw body for signature verification ✅
- All other routes receive parsed JSON bodies as expected ✅
- No route duplication ✅

## Files Modified

1. **backend/src/index.ts**
   - Changed `trust proxy` from `true` to `1`
   - Added webhook route registration before JSON parser
   - Imported `handleStripeWebhook` function

2. **backend/src/routes/stripe.ts**
   - Extracted webhook logic into exported `handleStripeWebhook` function
   - Removed duplicate middleware registration

## Testing

- ✅ TypeScript compilation successful
- ✅ No linting errors
- ✅ Build completed without errors

## What to Test

1. **Rate Limiting**: The app should now properly track client IPs behind the proxy
2. **Stripe Webhooks**: Webhook signature verification should now succeed
3. **Other Routes**: All non-webhook routes should continue to work normally with JSON parsing

## Deployment

To deploy these fixes:

```bash
cd backend
npm run build
docker-compose up -d --build backend
```

Or if using your existing deployment setup, just rebuild and restart the backend container.

