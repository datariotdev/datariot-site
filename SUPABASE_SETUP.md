# Supabase Backend Provisioning for Datariot

This guide outlines the step-by-step setup required to launch, configure, and connect your **Supabase** cloud instance to the Datariot mobile application.

---

## Step 1. Provision a New Project

1. Log into your [Supabase Console](https://supabase.com).
2. Click **New Project** and select your organization.
3. Define the project details:
   - **Name**: `datariot` (or your preferred project name)
   - **Database Password**: Generate a secure password, copy it, and keep it safe.
   - **Region**: Select the region closest to your target user base (e.g., *Central Europe*).
   - **Pricing Tier**: Select *Free Tier* to begin development.
4. Click **Create New Project** and allow 2-3 minutes for the database initialization to complete.

---

## Step 2. Deploy the Database Schema

1. From the left sidebar, navigate to the **SQL Editor**.
2. Click **New query** to create a blank workspace.
3. Import or paste the SQL schema script (typically found in your SQL migrations or provided schema outputs).
4. Click **Run** in the bottom-right corner of the editor.
5. Ensure the console prints `Success. No rows returned.` without warning markers.

> [!IMPORTANT]  
> Double-check that all automated triggers, such as `create_profile_on_signup`, are successfully registered. These triggers automatically provision a record in the `profiles` table when a new user registers.

---

## Step 3. Configure the Storage Bucket

Videos uploaded by users require a dedicated, high-performance storage bucket with configured Row Level Security (RLS) policies.

1. Navigate to the **Storage** section from the sidebar.
2. Click **New Bucket** and configure the fields:
   - **Bucket Name**: `videos`
   - **Allowed MIME Types**: `video/*` (restricts uploads to video content for safety)
   - **Public Bucket**: ✅ *Enabled* (allows public content streaming via Supabase CDN)
3. Under the bucket settings, go to the **Policies** tab and set the security guidelines:
   
   | Operation | Allowed Roles | SQL Policy Expression |
   | :--- | :--- | :--- |
   | **SELECT (Read)** | Public (All users) | Allow read access to all objects |
   | **INSERT (Upload)** | Authenticated Users | `auth.role() = 'authenticated'` |
   | **UPDATE (Edit)** | Owner (File Creator) | `auth.uid() = owner_id` |
   | **DELETE (Remove)** | Owner (File Creator) | `auth.uid() = owner_id` |

---

## Step 4. Retrieve API Credentials

1. Navigate to **Settings** (gear icon) -> **API**.
2. Copy the following keys to use in your local configuration:
   *   `Project URL` (Your API endpoint)
   *   `anon public` (Public client key, safe to bundle in frontend builds)
   *   `service_role` (Secret admin key, bypasses all RLS filters)

> [!WARNING]  
> The `service_role` key has full read/write bypass permissions to the entire database. Never expose it inside frontend source files or commit it to public code repositories. It should only be used in trusted backend environments, cloud functions, or migration scripts.

---

## Step 5. Configure Local Environment Variables

Create or update the `.env` file in the root directory of your Datariot project. Populate it with your retrieved keys:

```env
# Supabase project API endpoint URL
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Public anon key (exposed to client builds safely)
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3J0b2JkZXduc2N3YXpzaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODk5MTUsImV4cCI6MjAzMjQ2NTkxNX0.your_anon_key

# Admin service role key (restricted to backend/scripts)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3J0b2JkZXduc2N3YXpzaGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjg4OTkxNSwiZXhwIjoyMDc1MjUxNTY2fQ.your_service_role_key
```

> [!TIP]  
> In Expo projects, prefixing variables with `EXPO_PUBLIC_` automatically exposes them to the compiled bundle. Variables without this prefix remain completely hidden from the client runtime.

---

## Step 6. Setup Auth Providers

1. Navigate to **Authentication** -> **Providers**.
2. By default, **Email & Password** authentication is enabled.
3. *(Optional)* Turn on social logins (e.g., **Google**, **Apple**) by entering your Client ID and Redirect credentials from the Google or Apple developer portals.

---

Your Supabase backend is now configured and ready to connect to the Datariot application! Run your project locally to verify authentication and feed loaders.
