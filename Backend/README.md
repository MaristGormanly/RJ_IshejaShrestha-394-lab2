# Resume Upload Backend

This is a simple Express.js backend server that handles file uploads for resumes and other documents.

## Setup

1. Install dependencies:

```bash
cd Backend
npm install
```

2. Create a `.env` file in the root directory with the following content:

```
PORT=5000
NODE_ENV=development
```

3. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Upload File

- **POST** `/api/upload`
- Accepts multipart form data with a file field named 'file'
- Supports .txt, .pdf, .doc, and .docx files
- Maximum file size: 5MB

### Download File

- **GET** `/api/download/:filename`
- Downloads a previously uploaded file

## File Storage

Files are stored in the `uploads` directory. This directory is created automatically when the first file is uploaded.

## Error Handling

The server includes error handling for:

- File size limits
- Invalid file types
- Missing files
- Server errors

## Security

- CORS is enabled for all origins during development
- File type validation
- File size limits
- Secure file naming

## Adzuna API Integration

This application uses the Adzuna API to fetch real job listings. To set up this integration:

1. Sign up for an Adzuna API account at https://developer.adzuna.com/
2. Create a new application to obtain your App ID and API Key
3. Update your `.env` file with your Adzuna credentials:
   ```
   ADZUNA_APP_ID=your_app_id
   ADZUNA_API_KEY=your_api_key
   ```

The API has the following endpoints:

- `GET /api/jobs` - Search for jobs using the Adzuna API
  - Query parameters:
    - `what` - Job title or keywords
    - `where` - Location
    - `page` - Page number (default: 1)
    - `results_per_page` - Number of results per page (default: 10)

Example requests:

```
GET /api/jobs?what=software%20developer&where=london
GET /api/jobs?what=data%20scientist&page=2
```
