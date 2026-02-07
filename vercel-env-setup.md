# Vercel Environment Variables Setup

## Required Environment Variables for Production

### 1. AI Chat Configuration

The AI chat is currently failing because it's trying to use Ollama (local AI) which doesn't work on Vercel.

**Add these to Vercel Dashboard:**

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-... (your Anthropic API key)
```

**Alternative options:**
- Use OpenAI: Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...`
- Use another provider supported by Vercel AI SDK

### 2. Already Set (verify these exist)

```
DATABASE_URL=postgresql://... (your Neon database URL)
AUTH_SECRET=... (your auth secret)
```

## How to Add Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your ShreeHR project
3. Go to Settings → Environment Variables
4. Add each variable:
   - Key: `AI_PROVIDER`
   - Value: `anthropic`
   - Environment: Production (checked)
5. Add API key:
   - Key: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
   - Environment: Production (checked)
6. Click "Save" for each variable

## Getting an Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

## After Adding Variables

1. Trigger a new deployment:
   ```bash
   git commit --allow-empty -m "fix: configure AI provider for production"
   git push
   ```

2. Or redeploy from Vercel dashboard:
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

## Testing

After deployment:
1. Go to https://shreehr.vercel.app
2. Login as admin
3. Test navigation (should show all items for employee role)
4. Test AI Chat (should work without errors)

## Temporary Fix (if no API key yet)

The code now shows a clear error message instead of failing silently.
Users will see: "AI Chat is not configured for production"