# Crab Plus menu

Arabic restaurant menu and admin panel built with React/Vite, FastAPI, and MongoDB. The React app uses the same origin `/api` endpoints, so the frontend and API can be deployed as one Vercel project.

## Run locally

1. Install frontend packages with `cd frontend && npm install`.
2. Create a Python environment and install `requirements.txt`.
3. Copy `.env.example` to `.env` and set `MONGODB_HOST`, `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `ADMIN_PASSWORD`, and `ADMIN_SECRET`. You may alternatively set `MONGODB_URI` instead of the separate MongoDB connection values.
4. Start the API with `uvicorn backend.app:app --reload --port 8000`.
5. In another terminal, enter `frontend/` and run `npm run dev`. Set `VITE_API_URL=http://localhost:8000` in `frontend/.env.local` so Vite can reach the API.

Without MongoDB, the public API serves the starter menu. Admin sign-in and saving require MongoDB and the two admin secrets.

## Deploy to Vercel

Import this repository as a Vercel project with the repository root as its project root. The included `vercel.json` builds the frontend from `frontend/` and deploys the FastAPI function from the root `api/` directory. Add these Environment Variables in Vercel before deploying:

- `MONGODB_HOST`, `MONGODB_USERNAME`, and `MONGODB_PASSWORD`: Atlas cluster hostname, database user, and password. The API builds and URL-encodes the connection URI from them. Alternatively, set `MONGODB_URI` to the full Atlas connection string.
- `MONGODB_DB`: database name, for example `crab_plus`.
- `ADMIN_PASSWORD`: a strong password for `/admin`.
- `ADMIN_SECRET`: a separate random signing secret for admin sessions.
- `CORS_ORIGINS`: only needed if the API is hosted on another origin; include the exact frontend origin.

The database stores the whole editable site document in the `site_data` collection. The initial menu includes entries transcribed from the provided PDF plus the new items. Calories not listed in the supplied prices are left blank so they can be entered by the restaurant. Prices are shown in Saudi riyals to match the menu PDF and design reference.

Item and offer images uploaded from the admin panel are stored persistently in MongoDB GridFS (`menu_images` bucket). Uploads accept JPG, PNG, WEBP, and GIF files up to 4 MB; the API returns a public image URL used by the menu. The 4 MB limit keeps uploads below Vercel Functions' 4.5 MB request and response payload limit.

## Admin

Open `/admin`, sign in with `ADMIN_PASSWORD`, then manage menu items, item availability, prices, calories, image URLs, categories and their order, offers, contact details, map link, opening hours, and social links. Item order is controlled with the up/down controls. Images can be replaced with a direct image URL; uploaded storage can be added later by connecting a media provider such as Cloudinary.

The contact and map details beyond the supplied phone number are starter text from the design reference and should be replaced with the restaurant's final information.
