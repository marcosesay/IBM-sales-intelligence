# Sales Intelligence Briefing Tool

> AI-powered pre-call intelligence for sales engineers, powered by IBM watsonx.ai

Transform hours of manual research into seconds with AI-generated, comprehensive sales briefings. Simply provide a LinkedIn profile and company name to receive strategic insights, discovery questions, and product recommendations tailored to your prospect.

## 🚀 Features

- **Instant Briefing Generation**: Sub-2-second AI-powered briefings from LinkedIn profiles
- **User Profile Setup**: Personalized experience with name, role, and profile picture
- **Multiple Call Types**: Discovery, Competitive, Renewal/Upsell
- **Comprehensive Insights**:
  - Company background with real-time news (last 24 hours)
  - Contact profile extraction from LinkedIn
  - 8 tailored discovery questions
  - 3 IBM product recommendations with positioning
  - BANT + MEDDIC opportunity qualification
  - Sales strategy and talking points
- **Professional PDF Export**: Beautifully formatted briefings with company logos and contact photos
- **Real-time Streaming**: Watch insights generate in real-time with Server-Sent Events
- **Smart Image Handling**: Automatic fallback chain (profile photo → company logo → generated avatar)
- **Architecture Visualization**: Interactive flow diagram showing the complete briefing generation process
- **Dark/Light Mode**: Theme toggle for comfortable viewing

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling
- **jsPDF** for PDF generation
- **shadcn/ui** components

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Pino** for structured logging

### AI Integration
- **IBM watsonx.ai**: Enterprise-grade AI with Granite foundation models
- **Streaming responses**: Real-time content generation
- **Context-aware**: Adapts to industry, role, and call type

## 📋 Prerequisites

- Node.js 18+ and pnpm
- IBM watsonx.ai API credentials

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sales-intelligence-briefing.git
cd sales-intelligence-briefing
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory (use `.env.example` as a template):

```env
# Required: Anthropic API Key for Claude integration
AI_INTEGRATIONS_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Custom Anthropic API URL
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com

# Server Configuration
NODE_ENV=development
PORT=3000
```

**Note**: The application currently uses Anthropic's Claude API. IBM watsonx.ai integration is available but requires additional configuration.

### 4. Start the Application

```bash
# Terminal 1: Start the backend server
cd backend
pnpm run dev

# Terminal 2: Start the frontend development server
cd frontend
pnpm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📖 Usage

### First-Time Setup

1. **User Profile Setup** (Optional)
   - On first launch, you'll see a setup page
   - Enter your name and role (e.g., "Sales Engineer")
   - Optionally upload a profile picture
   - Click "Save and Continue" or "Skip for now"

### Generating Briefings

1. **Enter Contact Information**
   - Paste a LinkedIn profile URL (e.g., `https://www.linkedin.com/in/username`)
   - The system will automatically extract the contact's name and company
   - Add the company name manually if needed

2. **Select Call Type**
   - **Discovery**: Initial prospect meetings and needs assessment
   - **Competitive**: Displacing incumbent vendors
   - **Renewal & Upsell**: Existing customer expansion opportunities

3. **Add Context** (Optional)
   - Provide additional information about the opportunity
   - Mention specific pain points, initiatives, or background

4. **Generate Briefing**
   - Click "Generate Briefing" and watch insights stream in real-time
   - The briefing generates in under 2 seconds
   - Review comprehensive sections including:
     - Company & Contact Background
     - Real-time news from the last 24 hours
     - 8 tailored discovery questions
     - BANT + MEDDIC qualification framework
     - 3 IBM product recommendations with positioning

5. **Export to PDF**
   - Click "Export PDF" to download a professional briefing document
   - Includes company logo and contact photo (when available)
   - Share with your team or use during the call

6. **View Architecture**
   - Click "Architecture" in the sidebar to see the complete system flow
   - Interactive diagram showing the briefing generation process

## 🏗️ Project Structure

```
sales-intelligence-briefing/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── lib/             # Shared utilities
│   │   └── middlewares/     # Express middlewares
│   └── package.json
│
├── docs/                     # Documentation
│   ├── PROJECT_STRUCTURE.md # Detailed project organization guide
│   ├── CONTRIBUTING.md      # Contribution guidelines
│   └── DEPLOYMENT.md        # Deployment instructions
│
├── .gitignore               # Git ignore rules
├── LICENSE                  # MIT License
└── README.md                # This file
```

For a detailed explanation of the project organization, see [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md).

## 🔧 Configuration

### Call Type Templates

The application supports four call types, each with tailored prompts:

- **Discovery**: Focus on understanding needs and challenges
- **Competitive**: Emphasize differentiation and displacement strategies
- **EBC**: Executive-level strategic discussions
- **Retention & Upsell**: Expansion opportunities with existing customers

### Customizing AI Prompts

Edit `backend/src/routes/briefing.ts` to customize the AI prompts for each call type.

### PDF Styling

Modify `frontend/src/pages/BriefingPage.tsx` in the `buildPDF` function to customize:
- Layout and spacing
- Font sizes and styles
- Color scheme
- Section organization

## 🔐 Security Notes

- Never commit your `.env` file or API keys to version control
- Use environment variables for all sensitive configuration
- Implement rate limiting in production
- Add authentication for production deployments

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **IBM watsonx.ai** for enterprise-grade AI capabilities with Granite foundation models
- **Bob AI Assistant** for development acceleration
- **shadcn/ui** for beautiful UI components

## 📧 Contact

Marco Sesay - [LinkedIn](https://www.linkedin.com/in/marcosesay)

Project Link: https://github.com/marcosesay/sales-intelligence-briefing

---

**Built with ❤️ using IBM watsonx.ai and Bob AI Assistant**
