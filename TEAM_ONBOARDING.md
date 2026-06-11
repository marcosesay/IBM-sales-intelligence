# Team Onboarding Guide - Sales Intelligence Briefing Tool

> Quick start guide for getting your team members up and running with the Sales Intelligence Briefing Tool

## 📋 What Your Team Needs

### 1. **IBM watsonx.ai API Credentials** (Required)

**What does the IBM Cloud API do?**

The IBM watsonx.ai API is the AI engine that powers the sales intelligence tool. When you generate a briefing, here's what happens:

1. **You provide**: LinkedIn URL, company name, call type (Discovery/Competitive/Renewal)
2. **The tool sends**: A structured prompt to IBM watsonx.ai with your inputs
3. **watsonx.ai generates**: Comprehensive sales intelligence including:
   - Contact profile analysis
   - Company background research
   - 8 tailored discovery questions
   - BANT + MEDDIC qualification framework
   - 3 IBM product recommendations with positioning
   - Real-time company news (last 24 hours)
4. **You receive**: A complete pre-call briefing in under 2 seconds

The API uses IBM's Granite foundation models (enterprise-grade AI) to analyze the information and generate strategic insights specifically tailored to your prospect and call type.

**Getting Your API Credentials:**

Each team member needs their own IBM watsonx.ai API key:

1. **Get an IBM Cloud Account**
   - Visit [IBM Cloud](https://cloud.ibm.com)
   - Sign up or log in with your IBM credentials

2. **Create an API Key**
   - Go to [IBM Cloud API Keys](https://cloud.ibm.com/iam/apikeys)
   - Click "Create an IBM Cloud API key"
   - Give it a descriptive name (e.g., "Sales Briefing Tool")
   - **Important**: Copy and save the API key immediately - you won't be able to see it again!

3. **Get Your Project ID** (Optional but recommended)
   - Navigate to [watsonx.ai Projects](https://dataplatform.cloud.ibm.com/wx/home)
   - Create or select a project
   - Copy the Project ID from the project settings

**API Usage & Costs:**

- Each briefing generation = 1 API call to watsonx.ai
- Typical briefing uses ~2,000-4,000 tokens (input + output)
- IBM watsonx.ai offers free tier and pay-as-you-go pricing
- Check [IBM watsonx.ai Pricing](https://www.ibm.com/products/watsonx-ai/pricing) for current rates
- Monitor usage in your IBM Cloud dashboard

### 2. **Development Environment**

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org)
- **pnpm**: Install with `npm install -g pnpm`
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended

### 3. **Repository Access**

Share the repository with your team:
- GitHub URL: `https://github.com/marcosesay/sales-intelligence-briefing`
- Or provide access to your internal repository

---

## 🚀 Setup Options

Your team can run the Sales Intelligence Briefing Tool in two ways:

### Option A: Local Development Setup (Traditional)
Best for: Development, customization, or when Bob is not available

### Option B: Bob AI Assistant Setup (Recommended)
Best for: Quick deployment, team members already using Bob, minimal setup

---

## 🤖 Option B: Setting Up with Bob AI Assistant

If your team members already have Bob (the AI coding assistant), they can set up and run the tool directly through Bob with minimal effort.

### Prerequisites for Bob Setup

- Bob AI Assistant installed in VS Code
- IBM watsonx.ai API credentials (see above)
- Basic familiarity with Bob commands

### Step-by-Step Bob Setup

#### 1. **Open Bob and Clone the Repository**

In Bob, simply say:
```
Clone the sales intelligence briefing tool from 
https://github.com/marcosesay/sales-intelligence-briefing
```

Bob will:
- Clone the repository to your workspace
- Navigate to the project directory
- Prepare for setup

#### 2. **Install Dependencies via Bob**

Ask Bob:
```
Install all dependencies for both frontend and backend
```

Bob will automatically:
- Install frontend dependencies with pnpm
- Install backend dependencies with pnpm
- Verify successful installation

#### 3. **Configure Environment Variables**

Tell Bob:
```
Set up my environment variables for the backend. 
My watsonx API key is: [YOUR_API_KEY]
My project ID is: [YOUR_PROJECT_ID]
```

Bob will:
- Create the `.env` file in the backend directory
- Add your credentials securely
- Configure default settings

**Alternative**: You can also ask Bob to create the `.env` file and then manually edit it:
```
Create a .env file in the backend directory based on .env.example
```

#### 4. **Start the Application**

Simply tell Bob:
```
Start both the frontend and backend servers
```

Bob will:
- Open two terminal instances
- Start the backend server on port 3000
- Start the frontend server on port 5173
- Confirm both are running successfully

#### 5. **Access the Tool**

Bob will provide you with the URLs:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Bob Commands Cheat Sheet

Here are useful Bob commands for managing the tool:

| Task | Bob Command |
|------|-------------|
| **Start servers** | "Start the frontend and backend" |
| **Stop servers** | "Stop all running servers" |
| **Restart** | "Restart both servers" |
| **Check status** | "Are the servers running?" |
| **View logs** | "Show me the backend logs" |
| **Update dependencies** | "Update all project dependencies" |
| **Run tests** | "Run the test suite" |
| **Generate briefing** | "Help me test the briefing generation" |
| **Troubleshoot** | "The backend isn't starting, help me debug" |

### Advantages of Using Bob

✅ **Faster Setup**: No need to manually run commands in multiple terminals  
✅ **Guided Configuration**: Bob helps you set up environment variables correctly  
✅ **Automatic Troubleshooting**: Bob can diagnose and fix common issues  
✅ **Easy Updates**: Ask Bob to pull latest changes and update dependencies  
✅ **Context-Aware Help**: Bob understands the project structure and can guide you  
✅ **Multi-Terminal Management**: Bob handles running multiple processes seamlessly  

### Bob Setup Troubleshooting

If you encounter issues with Bob:

1. **Bob can't find the repository**
   - Provide the full GitHub URL
   - Ensure you have Git installed
   - Check your internet connection

2. **Environment variables not working**
   - Ask Bob to show you the `.env` file contents
   - Verify API key has no extra spaces
   - Ensure `.env` is in the `backend` directory

3. **Servers won't start**
   - Ask Bob: "Check if ports 3000 and 5173 are available"
   - Bob can kill conflicting processes
   - Verify Node.js version: "What version of Node.js am I running?"

4. **Dependencies fail to install**
   - Ask Bob to clear the cache: "Clear pnpm cache and reinstall"
   - Check Node.js version is 18+
   - Ensure pnpm is installed globally

---

## 🚀 Option A: Traditional Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/marcosesay/sales-intelligence-briefing.git
cd sales-intelligence-briefing
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### Step 3: Configure Environment

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# IBM watsonx.ai Configuration
WATSONX_API_KEY=your_actual_api_key_here
WATSONX_API_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_id_here

# Server Configuration
NODE_ENV=development
PORT=3000
```

**⚠️ Security Reminder**: Never commit the `.env` file to version control!

### Step 4: Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
```

### Step 5: Access the Tool

Open your browser to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## 🎯 First-Time User Experience

### Initial Setup (Optional)

When team members first open the tool, they'll see a setup page:

1. **Enter Profile Information**
   - Name (e.g., "John Smith")
   - Role (e.g., "Sales Engineer", "Account Executive")
   - Profile picture (optional)

2. **Skip or Save**
   - Can skip and set up later
   - Profile info personalizes the experience

### Creating Your First Briefing

1. **Enter Contact Details**
   - Paste a LinkedIn URL: `https://www.linkedin.com/in/username`
   - System auto-extracts name and company
   - Add company name if needed

2. **Select Call Type**
   - Discovery (initial meetings)
   - Competitive (displacing vendors)
   - Renewal & Upsell (existing customers)

3. **Add Context** (Optional)
   - Any relevant background information
   - Specific pain points or initiatives

4. **Generate & Export**
   - Click "Generate Briefing"
   - Watch insights stream in real-time (< 2 seconds)
   - Export to PDF for sharing

---

## 🔧 Troubleshooting Common Issues

### "API Key Invalid" Error

**Problem**: watsonx.ai credentials not working

**Solutions**:
1. Verify API key is correctly copied (no extra spaces)
2. Check that the API key hasn't expired
3. Ensure you have access to watsonx.ai services
4. Try regenerating the API key in IBM Cloud

**With Bob**: Ask "Help me verify my watsonx API credentials"

### "Cannot Connect to Backend" Error

**Problem**: Frontend can't reach the backend API

**Solutions**:
1. Verify backend is running on port 3000
2. Check for port conflicts: `lsof -i :3000`
3. Ensure `.env` file exists in backend directory
4. Check backend terminal for error messages

**With Bob**: Ask "The frontend can't connect to the backend, help me debug"

### Dependencies Installation Fails

**Problem**: `pnpm install` errors

**Solutions**:
1. Update Node.js to version 18 or higher
2. Clear pnpm cache: `pnpm store prune`
3. Delete `node_modules` and `pnpm-lock.yaml`, then reinstall
4. Check internet connection for package downloads

**With Bob**: Ask "Dependencies won't install, help me fix this"

### Port Already in Use

**Problem**: Port 3000 or 5173 already occupied

**Solutions**:
1. Kill existing process: `lsof -ti:3000 | xargs kill -9`
2. Or change port in `.env` (backend) or `vite.config.ts` (frontend)

**With Bob**: Ask "Port 3000 is in use, can you free it up?"

---

## 📚 Additional Resources

### Documentation
- **Full README**: [`README.md`](README.md) - Complete feature list and usage
- **Project Structure**: [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) - Code organization
- **Contributing**: [`CONTRIBUTING.md`](CONTRIBUTING.md) - Development guidelines

### IBM watsonx.ai Resources
- [watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [API Reference](https://cloud.ibm.com/apidocs/watsonx-ai)
- [Getting Started Guide](https://www.ibm.com/docs/en/watsonx-as-a-service?topic=started-getting)

### Bob AI Assistant Resources
- [Bob Documentation](https://docs.bob.build) - Learn more about Bob's capabilities
- [Bob Commands Reference](https://docs.bob.build/commands) - Complete command list
- [Bob Best Practices](https://docs.bob.build/best-practices) - Tips for effective use

### Support Channels
- **Internal**: Contact Marco Sesay - [LinkedIn](https://www.linkedin.com/in/marcosesay)
- **GitHub Issues**: Report bugs or request features
- **Team Slack**: #sales-intelligence-tool (if applicable)

---

## 🎓 Training & Best Practices

### Recommended Workflow

1. **Pre-Call Preparation** (2-3 minutes)
   - Generate briefing 30 minutes before call
   - Review all sections thoroughly
   - Customize discovery questions if needed
   - Export PDF for reference during call

2. **During the Call**
   - Keep PDF open for quick reference
   - Use discovery questions as conversation starters
   - Take notes on responses for follow-up

3. **Post-Call Follow-up**
   - Update CRM with insights gathered
   - Share briefing with team members
   - Generate new briefing for follow-up calls

### Tips for Maximum Value

- **LinkedIn URLs**: Use full profile URLs for best results
- **Context Field**: Add any known pain points or initiatives
- **Call Type**: Choose carefully - it tailors the entire briefing
- **PDF Export**: Share with team before group calls
- **Real-time News**: Check the 24-hour news section for timely talking points

### Using Bob for Enhanced Productivity

- **Quick Briefing Generation**: Ask Bob to help you test briefing generation
- **Code Customization**: Ask Bob to modify prompts or add features
- **Debugging**: Let Bob diagnose issues when things go wrong
- **Updates**: Ask Bob to pull latest changes from the repository
- **Documentation**: Ask Bob to explain any part of the codebase

---

## 🔐 Security Best Practices

### For Team Members

1. **Never share API keys** via email, Slack, or other channels
2. **Keep `.env` file local** - never commit to Git
3. **Use separate API keys** for each team member
4. **Rotate keys regularly** (every 90 days recommended)
5. **Report compromised keys** immediately to IBM Cloud
6. **When using Bob**: Be careful not to share API keys in Bob conversations that might be logged

### For Administrators

1. Set up **API key rotation policy**
2. Implement **rate limiting** in production
3. Add **authentication layer** for team deployments
4. Monitor **API usage** in IBM Cloud dashboard
5. Review **access logs** regularly

---

## 📊 Success Metrics

Track these metrics to measure adoption:

- **Briefings Generated**: Number per week/month
- **Time Saved**: Estimated hours saved on research
- **Call Success Rate**: Meetings that advance to next stage
- **Team Adoption**: Percentage of team using the tool
- **PDF Exports**: Briefings shared with stakeholders

---

## 🆘 Getting Help

### Quick Help Checklist

Before reaching out for help, try:

1. ✅ Check this onboarding guide
2. ✅ Review the main [README.md](README.md)
3. ✅ Search existing GitHub issues
4. ✅ Verify API credentials are correct
5. ✅ Restart both frontend and backend servers
6. ✅ If using Bob, ask Bob to diagnose the issue

### Contact Support

- **Technical Issues**: Open a GitHub issue with error details
- **API/Credentials**: Contact IBM Cloud support
- **Feature Requests**: Submit via GitHub issues
- **Internal Questions**: Reach out to Marco Sesay
- **Bob-Specific Issues**: Check Bob documentation or support

---

## ✅ Onboarding Checklist

Use this checklist to track team member setup:

### Prerequisites
- [ ] IBM Cloud account created
- [ ] watsonx.ai API key generated and saved
- [ ] Node.js 18+ installed
- [ ] pnpm installed globally (if not using Bob)
- [ ] Bob AI Assistant installed (if using Bob setup)

### Setup (Choose One Path)

**Path A: Bob Setup**
- [ ] Repository cloned via Bob
- [ ] Dependencies installed via Bob
- [ ] `.env` file configured via Bob
- [ ] Servers started via Bob
- [ ] Both servers confirmed running

**Path B: Traditional Setup**
- [ ] Repository cloned manually
- [ ] Dependencies installed (frontend & backend)
- [ ] `.env` file configured manually
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully

### Verification
- [ ] First briefing generated successfully
- [ ] PDF export tested
- [ ] Profile setup completed (optional)
- [ ] Team member comfortable with workflow

---

## 🎉 Welcome to the Team!

You're now ready to transform hours of research into seconds with AI-powered sales intelligence.

**Recommended Next Steps:**
1. Generate your first briefing with a real prospect
2. Explore the Architecture page to understand the system
3. Customize your user profile
4. Share your first PDF briefing with the team
5. Join the team Slack channel for tips and best practices

**Pro Tip**: If you're using Bob, bookmark these commands:
- "Start the briefing tool"
- "Generate a test briefing"
- "Show me the latest updates"

*Last Updated: June 2026*