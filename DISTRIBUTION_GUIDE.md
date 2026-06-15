# Sales Intelligence Tool - Distribution Guide

## How to Share This Tool With Others

This guide explains how to distribute the Sales Intelligence Tool to colleagues or team members via IBM Box.

---

## 📦 Distribution Package

The distribution package is available at:
**https://ibm.box.com/s/mhpbcc0kek3ox0i82zziy1b577js03o5**

This package includes:
- ✅ All source code
- ✅ Configuration files
- ✅ Documentation
- ❌ No credentials (secure)
- ❌ No node_modules (users install their own)
- ❌ No build artifacts

---

## 📤 How to Share

### Primary Method: IBM Box (Recommended)

**Share the Box link:**
https://ibm.box.com/s/mhpbcc0kek3ox0i82zziy1b577js03o5

Users can:
1. Click the link
2. Download `sales-intelligence-tool.tar.gz`
3. Extract and follow setup instructions

### Alternative Methods (If Needed)

**Option 1: Direct File Transfer**
- Email (if under size limit)
- Slack/Teams file upload
- USB drive

**Option 2: Other Cloud Storage**
- Upload to SharePoint, Google Drive, or Dropbox
- Share the link with team members

---

## 📥 Setup Instructions for Recipients

### Step 1: Extract the Package
```bash
# For .tar.gz
tar -xzf sales-intelligence-tool.tar.gz
cd sales-intelligence-briefing

# For .zip
unzip sales-intelligence-tool.zip
cd sales-intelligence-briefing
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Configure API Keys

Recipients need to create their own `backend/.env` file:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` and add their own credentials:

```env
# IBM watsonx.ai Configuration
WATSONX_API_KEY=their_watsonx_api_key_here
WATSONX_API_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=their_project_id_here

# Server Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Get API Keys

**IBM WatsonX API Key:**
1. Go to https://cloud.ibm.com/iam/apikeys
2. Click "Create an IBM Cloud API key"
3. Copy the key and paste it in `.env` as `WATSONX_API_KEY`

**IBM WatsonX Project ID:**
1. Go to https://dataplatform.cloud.ibm.com/wx/home
2. Create or open a project
3. Copy the Project ID from the project settings
4. Paste it in `.env` as `WATSONX_PROJECT_ID`

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at: http://localhost:5173

---

## 🔒 Security Best Practices

### For You (Distributor):
- ✅ Never include your `.env` file in the distribution
- ✅ Always use `.env.example` as a template
- ✅ Verify no credentials are in the package before sharing
- ✅ Keep your repository private if using Git

### For Recipients:
- ✅ Create their own API keys (never share keys)
- ✅ Keep their `.env` file private
- ✅ Never commit `.env` to version control
- ✅ Rotate keys if accidentally exposed

---

## 📋 What Recipients Need

### Required:
- Node.js 18+ installed
- npm or yarn package manager
- IBM Cloud account (free tier available)
- IBM WatsonX access

### Optional:
- Git (if using version control)
- VS Code or preferred IDE

---

## 🆘 Troubleshooting

### "WATSONX_API_KEY must be set" Error
- Ensure `.env` file exists in `backend/` directory
- Verify API key is correctly set in `.env`
- Check for typos in environment variable names

### Port Already in Use
- Change `PORT=3000` in `backend/.env` to another port
- Update `CORS_ORIGIN` in `backend/.env` to match frontend port

### Dependencies Installation Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For setup assistance, refer to:
- `README.md` - Full project documentation
- `SETUP_TROUBLESHOOTING.md` - Common issues and solutions
- `USER_GUIDE.md` - How to use the tool

---

## 🔄 Updates

When you make updates to the tool:

1. Create a new distribution package:
```bash
cd Python-Tool/artifacts/sales-intelligence-briefing
tar -czf ../sales-intelligence-tool-v2.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' --exclude='backend/.env' .
```

2. Upload the new package to IBM Box
3. Update the Box link if needed
4. Notify recipients of the update

---

## ✅ Pre-Distribution Checklist

Before sharing the package, verify:

- [ ] No `.env` file included
- [ ] No `node_modules` directories
- [ ] No personal credentials in any files
- [ ] `.env.example` is present and up-to-date
- [ ] README.md has clear setup instructions
- [ ] All documentation is current
- [ ] Package extracts correctly
- [ ] Box link is accessible

---

**Distribution Link:** https://ibm.box.com/s/mhpbcc0kek3ox0i82zziy1b577js03o5
**Created:** 2026-06-15
**Package Location:** `Python-Tool/artifacts/sales-intelligence-tool.tar.gz`