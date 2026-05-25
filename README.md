# In Flames Bootlegs Archive

A searchable archive of In Flames concert recordings and bootlegs. Discover live performances from around the world, filter by year, location, and song, and find videos of your favorite shows. 🎟️

Check it out [here](<https://in-flames-bootlegs.kiriancaumes.fr/>) 👈

![Preview](https://github-production-user-asset-6210df.s3.amazonaws.com/24525092/595535598-4d45c131-f203-45a4-a3d7-31e1a5c13ae6.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20260520%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260520T143853Z&X-Amz-Expires=300&X-Amz-Signature=0f5f2ccbf84095e6519e614e9b44add7728198332de4133bc1f4a77f43c73be3&X-Amz-SignedHeaders=host&response-content-type=image%2Fpng)

> *✨ A completely vibe coded application with AI assistance ✨*

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- [React 19](https://react.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- TypeScript 5
- Data source: Google Sheets (published as CSV)

## Prerequisites

- Node.js 24.x
- A Google Sheet published as CSV (see [Data Source](#data-source))
- *(Optional)* A YouTube Data API v3 key for playlist thumbnails

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the root of the project:

```env
# Required — URL of the Google Sheet exported as CSV
GOOGLE_SHEET_URL=https://sheets.googleapis.com/v4/spreadsheets/<id>/values/<range>

# Required — API key (for playlist thumbnail resolution and sheet)
GOOGLE_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Source

The app reads from a Google Sheet that must have the following columns (in order):

| Column | Description |
| --- | --- |
| `Title` | Concert title/name |
| `Date` | Concert date (`DD/MM/YYYY`) |
| `City` | City where the concert took place |
| `Country` | Country where the concert took place |
| `Setlist` | Setlist info or URL |
| `ProShot` | Whether a professional shot video exists |
| `Video` | Whether any video exists |
| `Full` | Whether a full show video exists |
| `Link` | Primary media link |
| `Setlist.fm` | Link to the Setlist.fm page |
| `Comment` | Additional notes |

To publish the sheet as CSV: **File → Share → Publish to web → CSV format**.

## Docker

A `Dockerfile` is included for containerised deployments.

```bash
# Build the image
docker build -t in-flames-bootlegs .

# Run the container (pass environment variables at runtime)
docker run -p 3000:3000 \
  -e GOOGLE_SHEET_URL="<your-sheet-url>" \
  -e GOOGLE_API_KEY="<your-api-key>" \
  in-flames-bootlegs
```

The app listens on port `3000`.
