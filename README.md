# AI Chatbot MVP

A simple, deployable AI chatbot built with Next.js, React, and OpenAI API.

## Features

- 🤖 AI-powered conversations using OpenAI GPT
- 💬 Clean and modern chat interface
- 📱 Responsive design
- ⚡ Fast and lightweight
- 🚀 Easy to deploy

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Redis database (for persistent storage - required for deployment)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   REDIS_URL=your_redis_connection_string_here
   ```
   
   **Note:** For local development, you can:
   1. Install Redis from [Vercel Marketplace](https://vercel.com/marketplace/redis) (recommended)
   2. Or use any Redis provider and set `REDIS_URL` in your `.env` file

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Install Redis from Vercel Marketplace:
   - Go to your project → Marketplace → Search "Redis"
   - Click "Install" and follow the setup
   - The `REDIS_URL` environment variable will be automatically added to your project
4. Add your `OPENAI_API_KEY` in the environment variables section (Settings → Environment Variables)
5. Deploy!

### Deploy to Other Platforms

This is a standard Next.js application, so it can be deployed to any platform that supports Node.js:

- **Netlify**: Connect your GitHub repo and add environment variables
- **Railway**: Import your repo and configure environment variables
- **AWS/Google Cloud/Azure**: Follow their Next.js deployment guides

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint for chat
│   ├── components/
│   │   ├── ChatMessage.tsx       # Message component
│   │   └── ChatInput.tsx         # Input component
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Customization

### Change the AI Model

Edit `.env` and add:
```
OPENAI_MODEL=gpt-4
```

Available models: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`, etc.

### Adjust Response Settings

Edit `app/api/chat/route.ts` to modify:
- `temperature`: Controls randomness (0-2)
- `max_tokens`: Maximum response length

## License

MIT
