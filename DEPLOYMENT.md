# Deployment Guide

## Publishing to GitHub

### 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name it: `sales-intelligence-briefing`
4. Description: "AI-powered pre-call intelligence for sales engineers, powered by IBM watsonx.ai"
5. Choose "Public" visibility
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 2. Push Your Local Repository

```bash
cd Python-Tool/artifacts/sales-intelligence-briefing

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/sales-intelligence-briefing.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Configure Repository Settings

1. Go to your repository on GitHub
2. Click "Settings" → "General"
3. Scroll to "Features" and enable:
   - ✅ Issues
   - ✅ Projects
   - ✅ Discussions (optional)

4. Add topics (click the gear icon next to "About"):
   - `ai`
   - `sales-intelligence`
   - `ibm-watsonx`
   - `typescript`
   - `react`
   - `nodejs`
   - `pdf-generation`
   - `sales-enablement`

### 4. Add a Repository Description

In the "About" section (top right of your repo):
- Description: "AI-powered pre-call intelligence for sales engineers, powered by IBM watsonx.ai"
- Website: (your demo URL if you have one)
- Add topics as listed above

## Environment Variables for Production

### Backend (.env)
```env
WATSONX_API_KEY=your_production_api_key
WATSONX_API_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_id
NODE_ENV=production
PORT=3000
```

### Security Checklist
- [ ] Never commit `.env` files
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add authentication if needed
- [ ] Set up CORS properly
- [ ] Use secure headers
- [ ] Enable logging and monitoring

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
cd frontend
vercel
```

**Backend (Railway):**
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `/backend`
5. Add environment variables
6. Deploy

### Option 2: Docker Deployment

Create `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - WATSONX_API_KEY=${WATSONX_API_KEY}
      - NODE_ENV=production
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Deploy:
```bash
docker-compose up -d
```

### Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

```bash
# Install Node.js and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Clone repository
git clone https://github.com/YOUR_USERNAME/sales-intelligence-briefing.git
cd sales-intelligence-briefing

# Setup backend
cd backend
pnpm install
cp .env.example .env
# Edit .env with your credentials
pnpm run build
pm2 start dist/index.js --name briefing-api

# Setup frontend
cd ../frontend
pnpm install
pnpm run build
# Serve with nginx or similar
```

## Post-Deployment

### 1. Test the Application
- [ ] Test all API endpoints
- [ ] Generate a sample briefing
- [ ] Export PDF
- [ ] Check error handling
- [ ] Verify image loading

### 2. Monitor
- Set up error tracking (Sentry, etc.)
- Monitor API usage
- Track performance metrics
- Set up uptime monitoring

### 3. Documentation
- Update README with live demo URL
- Add screenshots
- Create video demo
- Write blog post

## Updating the Repository

```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push origin main
```

## Creating Releases

```bash
# Tag a release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Then create a release on GitHub:
1. Go to "Releases" → "Create a new release"
2. Choose your tag
3. Add release notes
4. Publish release

## Maintenance

### Regular Updates
- Keep dependencies updated: `pnpm update`
- Review security advisories
- Update documentation
- Respond to issues
- Review pull requests

### Backup
- Regularly backup your `.env` files (securely)
- Export important data
- Document configuration changes

---

**Need Help?** Open an issue on GitHub or contact the maintainers.