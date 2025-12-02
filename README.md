# LeetClone

A LeetCode-like coding challenge platform with Judge0 code execution, Clerk authentication, and Gemini AI hints.

## Features

- **Authentication**: Clerk-based sign-up/sign-in with JWT sessions
- **Challenge Creation**: Admins can create coding challenges with:
  - Multiple language support (JavaScript, Python, C++, Java)
  - Custom test cases
  - Starter code per language
  - Difficulty levels (Easy/Medium/Hard)
- **Code Execution**: Self-hosted Judge0 CE (5s CPU, 256MB memory limits)
- **Shareable Links**: Each challenge gets a unique slug URL
- **Leaderboard**: Challenge creators can view user rankings
- **AI Hints**: Gemini-powered hints after 2 consecutive failed submissions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Monaco Editor
- **Auth**: Clerk
- **Database**: MongoDB (local) + Mongoose
- **Code Execution**: Judge0 CE (Docker)
- **AI**: Google Gemini API

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- Get Clerk keys from [clerk.com](https://clerk.com)
- Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Start MongoDB (local)

```bash
# Make sure MongoDB is running locally on port 27017
mongod --dbpath /path/to/data
```

### 4. Start Judge0 (Docker)

```bash
docker-compose up -d
```

This starts Judge0 CE on `http://localhost:2358`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Admin: Create a Challenge

1. Sign in
2. Go to `/challenges/create`
3. Fill in title, description, difficulty
4. Select supported languages
5. Add starter code for each language
6. Add test cases (input/output pairs)
7. Submit → get shareable link

### User: Solve a Challenge

1. Open the challenge link (e.g., `/challenges/abc-123`)
2. Select language
3. Write code in the Monaco editor
4. Click Submit
5. After 2 wrong answers, you'll receive an AI hint

### Creator: View Leaderboard

1. Go to your challenge page
2. Click "View Leaderboard"

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign-in/sign-up pages
│   ├── api/
│   │   ├── challenges/  # CRUD + leaderboard
│   │   ├── submissions/ # Code submission
│   │   ├── hints/       # AI hints
│   │   └── webhooks/    # Clerk webhook
│   └── challenges/
│       ├── create/      # Admin create page
│       └── [slug]/      # Challenge + leaderboard
├── lib/
│   ├── db.ts            # MongoDB connection
│   ├── judge0.ts        # Judge0 API wrapper
│   ├── gemini.ts        # Gemini AI wrapper
│   └── constants.ts     # Language mappings
└── models/
    ├── User.ts
    ├── Challenge.ts
    └── Submission.ts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `MONGODB_URI` | MongoDB connection string |
| `JUDGE0_API_URL` | Judge0 API URL (default: http://localhost:2358) |
| `GEMINI_API_KEY` | Google Gemini API key |

## License

MIT