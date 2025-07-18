# Link Analyzer & Web Crawler

A modern web application that analyzes websites by extracting metadata, counting links and images, and providing valuable insights about web pages.

## 🚀 Features

- **URL Analysis**: Extract and analyze metadata from any public webpage
- **Metadata Extraction**: Fetch title, description, headings, links, and images
- **Link Analysis**: Count and categorize internal vs. external links
- **Image Analysis**: Collect image information from web pages
- **Analysis History**: View and revisit previous analyses
- **Clean, Modern UI**: Responsive design with intuitive interface
- **API Endpoints**: Full REST API for integration with other applications

## 🛠️ Technologies Used

### Backend
- **Node.js** with **Express.js** framework
- **PostgreSQL** database for data persistence
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
- PostgreSQL (v14 or higher)

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/link-analyzer.git
   cd link-analyzer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create PostgreSQL database
   ```bash
   createdb linkanalyzer
   ```

4. Configure environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. Run the backend server
   ```bash
   npm run dev
   ```
   The server will run on port 9999 by default (http://localhost:9999)

### Frontend Setup
1. Navigate to the client directory
   ```bash
   cd client
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the React development server
   ```bash
   npm start
   ```
   The frontend will run on port 3000 by default (http://localhost:3000)

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze a new URL |
| GET | `/api/analyze` | Get analysis history |
| GET | `/api/analyze/:id` | Get analysis by ID |
| POST | `/api/analyze/:id/reanalyze` | Re-analyze a URL |

### Example API Request
```bash
curl -X POST http://localhost:9999/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 🧪 Testing

Run backend tests:
```bash
npm test
```

Run frontend tests:
```bash
cd client && npm test
```

## 📱 How to Use

1. Open the application in your browser (http://localhost:3000)
2. Enter a URL in the input field
3. Click "Analyze" button
4. View the analysis results displaying metadata, link counts, and other statistics
5. Access your analysis history to revisit previous analyses

## 🔄 Project Structure

```
link-analyzer/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       └── ...
├── src/                    # Backend Express application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middlewares
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── services/           # Business logic
├── logs/                   # Application logs
└── tests/                  # Test files
```

## 🔮 Future Enhancements

- User authentication and personal analysis history
- PDF report generation
- Batch URL processing
- SEO recommendations based on analysis
- Advanced crawling options

## 🚀 Deploying to Vercel

### Setup Steps

1. **Fork or clone this repository** to your GitHub account

2. **Connect your GitHub repository to Vercel**
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "New Project" and import your GitHub repository
   - Select the repository and configure as follows

3. **Configure your project in Vercel**
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: Leave default
   - Install Command: `npm install`

4. **Set environment variables**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your production PostgreSQL connection string
   - `ALLOWED_ORIGINS`: Your Vercel app URL (e.g., `https://your-app-name.vercel.app`)

5. **Deploy!**
   - Click "Deploy" and wait for the build to complete

### Troubleshooting Vercel Deployment

If you encounter a 404 "deployment not found" error:

1. **Check your routing configuration**
   - Verify your `vercel.json` file is correctly configured
   - Make sure API routes are properly set up

2. **Database connection issues**
   - Confirm your `DATABASE_URL` environment variable is set correctly
   - Ensure your database provider allows connections from Vercel
   - Check SSL settings for your database connection

3. **Build failures**
   - Check build logs in the Vercel dashboard for errors
   - Make sure all dependencies are correctly listed
   - Verify build scripts are properly configured

4. **API routes not working**
   - Check that frontend API calls use the correct URLs
   - Verify CORS settings in your Express app

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

Created by [Michele Autorino]

---

⭐ If you find this project useful, please consider giving it a star on GitHub! ⭐
