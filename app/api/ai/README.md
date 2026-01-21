# AI Chat API - Restructured

## What Changed

### Previous Issues
- ❌ Wrong model name (gemini-1.5-flash doesn't exist)
- ❌ Too aggressive rate limiting (30 seconds between requests)
- ❌ All errors returned "quota exhausted" message
- ❌ No retry logic for transient failures

### Improvements
- ✅ **Correct model name** (gemini-2.5-flash)
- ✅ Better rate limiting (2 requests per 10 seconds)
- ✅ Automatic retry with exponential backoff
- ✅ Proper error handling and logging
- ✅ Centralized Gemini configuration

## File Structure

```
app/api/ai/chat/
  └── route.ts          # Main API endpoint
lib/
  └── gemini-config.ts  # Shared Gemini configuration
check-api-key.js        # Check API key and list models
test-gemini-api.js      # Test script for API
```

## Testing Your Setup

### 1. Check if your API key is valid:
```bash
node check-api-key.js
```

### 2. Test the API:
```bash
node test-gemini-api.js
```

## Available Models (as of Jan 2026)

- `gemini-2.5-flash` ⭐ (Currently used - fast and efficient)
- `gemini-2.5-pro` (More capable, slower)
- `gemini-flash-latest` (Always latest flash version)
- `gemini-pro-latest` (Always latest pro version)

## Rate Limits (Gemini Free Tier)

- **Per minute**: 15 requests
- **Per day**: 1500 requests
- **Our app limit**: 2 requests per 10 seconds per IP

## Troubleshooting

### "AI quota exhausted" Error

1. **Wait 1-2 minutes** - You may have hit the per-minute limit (15 req/min)
2. **Check daily quota** - Free tier has 1500 requests/day
3. **Verify API key** - Run `node check-api-key.js`
4. **Check console logs** - Look for detailed error messages in terminal

### API Key Issues

Make sure your `.env` file has:
```
GOOGLE_AI_API_KEY=your_actual_key_here
```

Get a new key at: https://aistudio.google.com/app/apikey

### Model Not Found Error

If you see "model not found", the model name may have changed. Run:
```bash
node check-api-key.js
```
This will list all available models.

## Error Responses

- **429**: Rate limit or quota exceeded
- **400**: Invalid request payload
- **500**: Server configuration or unexpected error
