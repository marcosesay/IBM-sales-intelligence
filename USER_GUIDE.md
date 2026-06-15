# Sales Intelligence Briefing - User Guide

## 📋 Quick Start Guide

This guide will help you set up and run the Sales Intelligence Briefing application on your local machine.

---

## 🎯 What You'll Tell Bob

When you're ready to set up this project, simply tell Bob:

```
"Clone the sales-intelligence-briefing repository from GitHub and help me set it up locally"
```

Or if you already have the code:

```
"Help me set up and run the sales-intelligence-briefing project"
```

Bob will guide you through the entire setup process!

---

## 📦 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **pnpm** - Install with: `npm install -g pnpm`
3. **Git** - [Download here](https://git-scm.com/)
4. **IBM Cloud Account** (for WatsonX AI) - [Sign up here](https://cloud.ibm.com/)

---

## 🚀 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/marcosesay/sales-intelligence-briefing.git
cd sales-intelligence-briefing
```

### Step 2: Install Dependencies

#### Backend Setup
```bash
cd backend
pnpm install
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd ../backend
touch .env
```

Add the following configuration to `backend/.env`:

```env
# IBM WatsonX AI Configuration
WATSONX_API_KEY=your_watsonx_api_key_here
WATSONX_PROJECT_ID=your_project_id_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: Custom Model Settings
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

**How to get your WatsonX credentials:**
1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to **Watson Studio** or **WatsonX.ai**
3. Create a new project or select an existing one
4. Copy your **API Key** and **Project ID**
5. Paste them into your `.env` file

### Step 4: Run the Application

You have two options:

#### Option A: Quick Start Scripts (Recommended)

**On macOS/Linux:**
```bash
./quick-start.sh
```

**On Windows:**
```bash
quick-start.bat
```

These scripts will automatically:
- Start the backend server on `http://localhost:3001`
- Start the frontend development server on `http://localhost:5173`
- Open your browser to the application

#### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser to: `http://localhost:5173`

---

## 🎨 Using the Application

### 1. Enter Contact Information

You can enter contact details in two ways:

**Manual Entry:**
- Fill in the contact form fields manually
- Enter: Name, Company, Title, Email, Phone

**LinkedIn Auto-Population (🆕):**
- Paste a LinkedIn profile URL into the "LinkedIn URL" field
- The app will automatically extract and populate contact information
- Try these demo profiles:
  - `https://www.linkedin.com/in/lisbeth-dereaux` (Lisbeth Dereaux - Griffitts LLC)
  - `https://www.linkedin.com/in/jamie-dimon` (Jamie Dimon - JP Morgan Chase)

### 2. Generate Briefing

1. Click the **"Generate Briefing"** button
2. Watch as the AI streams real-time insights about:
   - Company overview and recent news
   - Industry trends and analysis
   - Personalized talking points
   - Strategic recommendations

### 3. Review and Use

- The briefing appears in real-time as it's generated
- Copy sections you need for your sales call
- Use the insights to prepare for your meeting

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Module not found" errors
**Solution:** Make sure you've installed dependencies in both directories:
```bash
cd backend && pnpm install
cd ../frontend && npm install
```

#### 2. "Port already in use"
**Solution:** Kill the process using the port:
```bash
# Find process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Find process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

#### 3. WatsonX API errors
**Solution:** Verify your `.env` file:
- Check that `WATSONX_API_KEY` is correct
- Verify `WATSONX_PROJECT_ID` matches your IBM Cloud project
- Ensure there are no extra spaces or quotes

#### 4. LinkedIn auto-population not working
**Note:** LinkedIn actively blocks automated scraping. The app includes demo profiles as fallbacks. For production use, consider:
- Using LinkedIn's official API
- Manual data entry
- Third-party data enrichment services

### Still Having Issues?

Check the detailed troubleshooting guide:
```bash
cat SETUP_TROUBLESHOOTING.md
```

Or review the logs:
- **Backend logs:** Check the terminal running `pnpm run dev`
- **Frontend logs:** Check browser console (F12)

---

## 📁 Project Structure

```
sales-intelligence-briefing/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── lib/            # WatsonX client
│   │   └── index.ts        # Server entry point
│   ├── .env                # Environment variables (create this)
│   └── package.json
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── pages/          # React components
│   │   └── main.tsx        # App entry point
│   └── package.json
├── quick-start.sh          # macOS/Linux startup script
├── quick-start.bat         # Windows startup script
└── README.md               # Project documentation
```

---

## 🆕 New Features

- **LinkedIn Auto-Population:** Paste LinkedIn URLs to auto-fill contact info
- **Demo Profiles:** Built-in test profiles for quick demos
- **Company Website Discovery:** Automatic company website lookup
- **Enhanced Error Handling:** Better error messages and fallbacks
- **Real-time Streaming:** Watch briefings generate in real-time

---

## 🔒 Security Notes

- **Never commit your `.env` file** - It contains sensitive API keys
- The `.gitignore` file is configured to exclude `.env` files
- Keep your WatsonX API key secure and don't share it
- Rotate API keys regularly for security

---

## 🤝 Getting Help

If you need assistance:

1. **Ask Bob:** Simply describe your issue to Bob in natural language
2. **Check Documentation:** Review `README.md` and `SETUP_TROUBLESHOOTING.md`
3. **Review Logs:** Check terminal output for error messages
4. **GitHub Issues:** Report bugs at the repository

---

## 📚 Additional Resources

- [IBM WatsonX Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Backend server running on `http://localhost:3001`
- [ ] Frontend server running on `http://localhost:5173`
- [ ] Application opens in browser
- [ ] Can enter contact information
- [ ] LinkedIn auto-population works with demo profiles
- [ ] "Generate Briefing" button creates AI-powered briefings
- [ ] No console errors in browser or terminal

---

## 🎉 You're Ready!

Once everything is running, you can start generating AI-powered sales briefings! The application will help you prepare for sales calls with personalized insights and talking points.

**Happy Selling! 🚀**