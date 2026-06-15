# Setup Troubleshooting Guide - IBM watsonx.ai

## 🔍 Key Findings from Deployment Analysis

After analyzing a working deployment, here are the critical gaps and solutions for getting the Sales Intelligence Tool running with **IBM watsonx.ai**.

## ⚠️ CRITICAL: Your Current Setup Issue

**Problem**: Your project currently uses Anthropic Claude API instead of IBM watsonx.ai

**Evidence**:
- File: `backend/node_modules/@workspace/integrations-ibm-watsonx/src/client.ts`
- Line 1: `import Anthropic from "@anthropic-ai/sdk";`
- Line 27: Model is set to `"claude-fable-5"`

**Solution**: You need to switch to the proper IBM watsonx.ai integration (see below)

---

## ✅ Complete Setup Guide for IBM watsonx.ai

### Step 1: Get IBM watsonx.ai Credentials

1. **Get API Key**:
   - Go to https://cloud.ibm.com/iam/apikeys
   - Click "Create an IBM Cloud API key"
   - Copy the API key (you won't see it again!)

2. **Get Project ID**:
   - Go to https://dataplatform.cloud.ibm.com/
   - Navigate to your watsonx.ai project
   - Click on "Manage" tab
   - Copy the "Project ID"

3. **Test Your Credentials** (Optional but Recommended):
   ```bash
   cd backend
   node test-watsonx-credentials.mjs
   ```
   This will verify your API key and list available projects.

### Step 2: Configure Environment Variables

Create or update `backend/.env`:

```env
# IBM watsonx.ai Configuration
WATSONX_API_KEY=your_actual_api_key_here
WATSONX_PROJECT_ID=your_actual_project_id_here
WATSONX_API_URL=https://us-south.ml.cloud.ibm.com

# Server Configuration  
NODE_ENV=development
PORT=3000

# CORS Configuration (optional)
CORS_ORIGIN=http://localhost:5173
```

**Important**: Replace `your_actual_api_key_here` and `your_actual_project_id_here` with your real credentials!

### Step 3: Update the Integration Package

The integration package needs to use IBM watsonx instead of Anthropic Claude.

**Option A: Use the New watsonx Client** (Recommended)

I've created a proper IBM watsonx client at:
`backend/src/lib/watsonx-client.ts`

Update `backend/src/routes/briefing.ts` line 2:
```typescript
// Change from:
import { generateTextStream } from "@workspace/integrations-ibm-watsonx";

// To:
import { generateTextStream } from "../lib/watsonx-client";
```

**Option B: Fix the Workspace Package**

Edit `backend/node_modules/@workspace/integrations-ibm-watsonx/src/client.ts` and replace the Anthropic code with IBM watsonx code (see the watsonx-client.ts file I created as reference).

### Step 4: Install Dependencies (if needed)

```bash
cd backend
pnpm install @ibm-cloud/watsonx-ai ibm-cloud-sdk-core

cd ../frontend
pnpm install vite
```

**Note**: If you encounter "vite: command not found" errors, run:
```bash
cd frontend
pnpm install --force
```

### Step 5: Start the Application

**Terminal 1 - Backend**:
```bash
cd backend
pnpm run dev
```

Wait for: `Server listening on port 3000`

**Terminal 2 - Frontend**:
```bash
cd frontend  
pnpm run dev
```

Wait for: `Local: http://localhost:5173/`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Something went wrong. Please try again."

**Root Causes**:
1. Backend server not running
2. Wrong API credentials
3. Using Anthropic instead of watsonx

**Solutions**:

**A. Check Backend is Running**:
```bash
# Test health endpoint
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

**B. Verify Credentials**:
```bash
cd backend
node test-watsonx-credentials.mjs
```

**C. Check Backend Logs**:
Look in Terminal 1 for error messages like:
- `WATSONX_API_KEY must be set`
- `WATSONX_PROJECT_ID must be set`
- `401 Unauthorized` (invalid API key)
- `403 Forbidden` (invalid project ID)

### Issue 2: Frontend Won't Load (localhost:5173)

**Cause**: Missing node_modules or corrupted pnpm workspace

**Solution A - Clean Reinstall** (Recommended):
```bash
# From project root
rm -rf node_modules frontend/node_modules backend/node_modules lib/*/node_modules
rm -rf .pnpm-store
pnpm install
```

**Solution B - Force Frontend Install**:
```bash
cd frontend
rm -rf node_modules
pnpm install --force
pnpm run dev
```

**Solution C - Use Original Clean Repository**:
If the personal copy has corrupted dependencies, use the original:
```bash
cd "Python-Tool/artifacts/sales-intelligence-briefing"
# Add your credentials to backend/.env
./quick-start.sh
```

### Issue 3: "vite: command not found"

**Cause**: Frontend dependencies not installed in node_modules

**Missing Packages** (70+ packages including):
- vite (build tool)
- react, react-dom (UI framework)
- @vitejs/plugin-react (Vite React plugin)
- tailwindcss (styling)
- @radix-ui/* (40+ UI components)
- @tanstack/react-query (data fetching)
- All other devDependencies from frontend/package.json

**Solution**:
```bash
cd frontend
rm -rf node_modules
pnpm install
# Verify vite is installed
ls -la node_modules/.bin/vite
```

Check for compilation errors in the terminal.

### Issue 3: "Cannot find module '@ibm-cloud/watsonx-ai'"

**Solution**:
```bash
cd backend
pnpm install @ibm-cloud/watsonx-ai ibm-cloud-sdk-core
```

### Issue 4: Invalid Model Errors

**Valid IBM watsonx Models**:
- `ibm/granite-13b-chat-v2` (recommended for chat)
- `ibm/granite-13b-instruct-v2`
- `ibm/granite-20b-multilingual`
- `meta-llama/llama-2-70b-chat`
- `google/flan-ul2`

**To change model**: Edit line 261 in `backend/src/routes/briefing.ts`:
```typescript
model: "ibm/granite-13b-chat-v2",  // Change this
```

### Issue 5: Rate Limiting / Quota Errors

**Symptoms**:
- Error 429: Too Many Requests
- "Quota exceeded" messages

**Solutions**:
1. Wait a few minutes before trying again
2. Check your IBM Cloud usage limits
3. Upgrade your watsonx.ai plan if needed

---

## 📋 Complete Startup Checklist

### Every Time You Start the App:

- [ ] **1. Verify .env file exists**
  ```bash
  cat backend/.env
  # Should show WATSONX_API_KEY and WATSONX_PROJECT_ID
  ```

- [ ] **2. Start Backend** (Terminal 1)
  ```bash
  cd backend && pnpm run dev
  # Wait for: "Server listening on port 3000"
  ```

- [ ] **3. Test Backend Health**
  ```bash
  curl http://localhost:3000/api/health
  # Should return: {"status":"ok"}
  ```

- [ ] **4. Start Frontend** (Terminal 2)
  ```bash
  cd frontend && pnpm run dev
  # Wait for: "Local: http://localhost:5173/"
  ```

- [ ] **5. Open Application**
  - Navigate to: http://localhost:5173
  - Try generating a briefing

---

## 🔧 Advanced Debugging

### Test Backend API Directly

```bash
# Test the generate endpoint
curl -X POST http://localhost:3000/api/briefing/generate \
  -H "Content-Type: application/json" \
  -d '{
    "company": "IBM",
    "industry": "Technology",
    "contactName": "Test User",
    "contactTitle": "Engineer",
    "callType": "Discovery"
  }'
```

### Check Browser Console (F12)

Look for:
- Network errors (red in Network tab)
- Failed API calls to `/api/briefing/generate`
- Specific error messages in Console tab

### Check Backend Terminal

Look for:
- `WATSONX_API_KEY must be set`
- `WATSONX_PROJECT_ID must be set`  
- HTTP error codes (401, 403, 429, 500)
- Stack traces

### Verify watsonx Credentials

```bash
cd backend
node test-watsonx-credentials.mjs
```

This script will:
1. Test your API key
2. List your available projects
3. Test your Project ID
4. Show detailed error messages

---

## 🆚 Key Differences from Other Deployments

### What Brandon's Version Did:

1. **Created a Stub**: Replaced real AI with a placeholder
2. **Simplified Structure**: Removed workspace dependencies
3. **No Real AI**: Just returned fake responses

### What Your Version Should Have:

1. **Real IBM watsonx.ai**: Actual AI-powered briefings
2. **Proper Integration**: Using official IBM SDK
3. **Full Features**: News, logos, PDF export, etc.

---

## 🎯 Success Indicators

You know it's working when:

- ✅ Backend shows: `Server listening on port 3000`
- ✅ Frontend shows: `Local: http://localhost:5173/`
- ✅ `curl http://localhost:3000/api/health` returns `{"status":"ok"}`
- ✅ http://localhost:5173 loads the application
- ✅ Clicking "Generate Briefing" streams AI-generated text
- ✅ No errors in browser console or backend terminal

---

## 📞 Still Having Issues?

### Checklist:

1. ✅ Both servers running? (backend AND frontend)
2. ✅ `.env` file exists with real credentials?
3. ✅ Credentials tested with `test-watsonx-credentials.mjs`?
4. ✅ Using IBM watsonx (not Anthropic Claude)?
5. ✅ Backend health endpoint working?
6. ✅ Browser console showing specific errors?

### Get Help:

1. Run the credential tester: `node backend/test-watsonx-credentials.mjs`
2. Check backend terminal for error messages
3. Check browser console (F12) for frontend errors
4. Verify you're using the IBM watsonx integration (not Anthropic)

---

## 🚀 Quick Reference Commands

```bash
# One-time setup
cd backend && pnpm install
cd ../frontend && pnpm install

# Test credentials
cd backend && node test-watsonx-credentials.mjs

# Start backend (Terminal 1)
cd backend && pnpm run dev

# Start frontend (Terminal 2)  
cd frontend && pnpm run dev

# Test backend health
curl http://localhost:3000/api/health

# Test generate endpoint
curl -X POST http://localhost:3000/api/briefing/generate \
  -H "Content-Type: application/json" \
  -d '{"company":"IBM","industry":"Technology","callType":"Discovery"}'
```

---

**Remember**: The #1 issue is forgetting to start the backend server or using Anthropic instead of IBM watsonx!