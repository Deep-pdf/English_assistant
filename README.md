# Madam July - English Interview Tutor

A web application that provides an interactive English interview practice experience with speech recognition and AI-powered responses.

## Features

- Speech-to-text input using browser's Speech Recognition API
- AI-powered tutor responses using Google's Gemini AI
- Conversation history stored in Supabase database
- Text-to-speech output for tutor responses
- Real-time chat interface

## Project Structure

```
├── index.html          # Frontend HTML
├── script.js           # Frontend JavaScript
├── style.css           # Frontend styling
├── setup_db.sql        # Database schema
└── backend/
    ├── package.json    # Backend dependencies
    └── server.js       # Express server with AI integration
```

## Prerequisites

- Node.js (v16 or higher)
- A Supabase account and project
- Google Gemini API key

## Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to your Supabase dashboard and navigate to the SQL Editor

3. Copy the contents of `setup_db.sql` and execute it in the SQL Editor

This will create the necessary tables:
- `conversations` - Stores conversation metadata
- `messages` - Stores individual messages in conversations

## API Keys and Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```

#### How to get the API keys:

1. **Supabase URL and Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" for `SUPABASE_URL`
   - Copy the "service_role" key (under "Project API keys") for `SUPABASE_SERVICE_ROLE_KEY`

2. **Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for `GEMINI_API_KEY`

### Frontend Configuration

The frontend has hardcoded Supabase credentials in `script.js`. For production, consider moving these to environment variables or a config file.

## Installation and Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file with your API keys (as described above)

4. Start the backend server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000` by default.

### Frontend Setup

1. Open `index.html` in your web browser

2. Make sure the backend is running on port 3000

## Usage

1. Click the "Start Talking" button to begin speech recognition
2. Speak your interview question or response
3. The app will transcribe your speech and send it to the AI tutor
4. Madam July will respond with feedback and the next question
5. Use the "Clear" button to reset the conversation

## API Endpoints

### POST /api/chat
Sends a message to the AI tutor and receives a response.

**Request Body:**
```json
{
  "conversationId": "uuid",
  "userText": "string"
}
```

**Response:**
```json
{
  "botText": "string"
}
```

### GET /
Health check endpoint that returns server status.

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini AI
- **Speech Recognition:** Web Speech API
- **Speech Synthesis:** Web Speech Synthesis API

## Browser Support

- Chrome/Edge: Full support (Speech Recognition and Synthesis)
- Firefox: Limited support (may require flags)
- Safari: Limited support

## Troubleshooting

### Common Issues:

1. **Speech recognition not working:**
   - Ensure you're using Chrome or Edge
   - Check browser permissions for microphone access
   - Make sure HTTPS is enabled (required for speech recognition in some browsers)

2. **Backend connection errors:**
   - Verify the backend is running on port 3000
   - Check that all environment variables are set correctly
   - Ensure CORS is properly configured

3. **Database errors:**
   - Confirm the Supabase project is active
   - Verify the service role key has the necessary permissions
   - Check that the database schema has been created

4. **AI responses not working:**
   - Verify your Gemini API key is valid and has quota remaining
   - Check the API key permissions

## Development

To modify the application:

- Frontend changes: Edit `index.html`, `script.js`, and `style.css`
- Backend changes: Edit `backend/server.js`
- Database changes: Modify `setup_db.sql` and run in Supabase SQL Editor

## License

ISC License