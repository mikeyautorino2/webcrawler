# Link Analyzer & Web Crawler

A modern web application that analyzes websites by extracting metadata, counting links and images, and providing insights about web pages. Features browser-only history storage for privacy and no database requirements.

## 🚀 Features

- **URL Analysis**: Extract and analyze metadata from any public webpage
- **Metadata Extraction**: Fetch title, description, headings, links, and images
- **Link Analysis**: Count and categorize internal vs. external links
- **Image Analysis**: Collect image information from web pages
- **Browser-Only History**: View and revisit previous analyses stored locally
- **Privacy-First**: No shared data, all history local to your browser
- **Clean, Modern UI**: Responsive design with intuitive interface
- **Serverless Ready**: Deployable to Vercel with no database setup

## 🛠️ Technologies Used

### Backend
- **Node.js** with **Express.js** framework
- **LocalStorage** for browser-only history management
- **Cheerio** for HTML parsing and web scraping
- **Axios** for HTTP requests
- **Jest** for backend testing

### Frontend
- **React.js** for dynamic UI
- **CSS3** with variables for consistent styling
- **Axios** for API communication

## 🧰 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- No database required

### Quick Start
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/link-analyzer.git
   cd link-analyzer
   ```

2. Install all dependencies
   ```bash
   npm install
   npm run install-client
   ```

3. Run the full stack application
   ```bash
   npm run dev-full
   ```
   - Backend runs on http://localhost:9999
   - Frontend runs on http://localhost:3000

### Development Commands
- `npm run dev` - Backend only with nodemon
- `npm run client` - Frontend only
- `npm run dev-full` - Both backend and frontend concurrently
- `npm run build` - Full production build
- `npm test` - Run backend tests

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze a URL and return metadata |
| GET | `/health` | Health check endpoint |

### Example API Request
```bash
curl -X POST http://localhost:9999/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Example Response
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "This domain is for use in examples",
    "headings": {
      "h1": ["Example Domain"],
      "h2": [],
      "h3": []
    },
    "links": {
      "total": 1,
      "internal": 0,
      "external": 1
    },
    "images": {
      "total": 0
    },
    "wordCount": 101
  }
}
```

## 🧪 Testing

Run backend tests:
```bash
npm test
```

Tests are configured for the backend only and located in the `/tests/` directory.

## 📱 How to Use

1. Open the application in your browser (http://localhost:3000)
2. Enter a URL in the input field
3. Click "Analyze" button
4. View the analysis results displaying metadata, link counts, and other statistics
5. Access your browser-only analysis history to revisit previous analyses
6. Clear history anytime with the confirmation dialog

## 🔄 Project Structure

```
webcrawler-proj/
├── api/                    # Vercel serverless functions
│   └── index.js            # Main API endpoint
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       └── utils/          # API client & localStorage utils
├── src/                    # Backend Express application
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── services/           # Web crawler service
│   └── utils/              # URL validation utilities
├── tests/                  # Backend test files
├── vercel.json             # Vercel deployment config
└── build.sh               # Production build script
```

## 🚀 Deployment

### Vercel Deployment
This project is configured for easy Vercel deployment:

```bash
npm run vercel-build
```

The build process:
- Builds React frontend to `/client/build/`
- Configures serverless function at `/api/index.js`
- No database setup required

### Environment Variables (Optional)
- `NODE_ENV` - Set to 'production' for production
- `PORT` - Server port (defaults to 9999)
- `ALLOWED_ORIGINS` - CORS allowed origins

## 🔮 Future Enhancements

- PDF report generation
- Batch URL processing
- SEO recommendations based on analysis
- Advanced crawling options
- Export analysis results

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

Created by Michele Autorino

---

⭐ If you find this project cool or useful, please consider giving it a star on GitHub! ⭐
