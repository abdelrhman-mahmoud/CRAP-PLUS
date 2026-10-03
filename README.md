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

Import this repository with the repository root as the project root, then select **Services** as the project framework. The root `vercel.json` configures two services in the same deployment:

- `frontend` serves the Vite site on `/` and handles `/admin`.
- `app` runs `backend.app:app`; public requests under `/api/*` route to this FastAPI service.

The browser calls the API on the same domain, so leave `VITE_API_URL` unset in Vercel. No service binding is needed: the frontend calls the public `/api/*` route from the browser, and the backend does not call another Vercel service.

Add these Environment Variables in Vercel for Production and Preview:

- `MONGODB_URI`: the Atlas connection string. Alternatively, set `MONGODB_HOST`, `MONGODB_USERNAME`, and `MONGODB_PASSWORD` instead.
- `MONGODB_DB`: database name, for example `crab_plus`.
- `ADMIN_PASSWORD`: a strong password for `/admin`.
- `ADMIN_SECRET`: a separate random signing secret for admin sessions.
- `CORS_ORIGINS`: only needed if a different site origin will call the API; same-domain requests do not need it.

Do not put the MongoDB URI or admin secrets in frontend variables such as `VITE_*`.

The database stores the editable site document in the `site_data` collection. Item and offer uploads are stored in MongoDB GridFS (`menu_images` bucket), and unused uploads are pruned after saves or when an unfinished image edit is canceled. Uploads accept JPG, PNG, WEBP, and GIF files up to 4 MB.

## Admin

Open `/admin`, sign in with `ADMIN_PASSWORD`, then manage menu items, item availability, prices, calories, image URLs, categories and their order, offers, contact details, map link, opening hours, and social links. Item order is controlled with the up/down controls. Images can be uploaded directly from a device or replaced with a direct image URL.

The contact and map details beyond the supplied phone number are starter text from the design reference and should be replaced with the restaurant's final information.
