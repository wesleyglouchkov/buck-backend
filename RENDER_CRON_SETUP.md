# Render Cron Job Setup

Follow these steps to set up the **Stream Reminder Script** as a Cron Job on Render.

## 1. Create the Cron Job
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Cron Job**.
3. Connect your GitHub repository (`buck-backend`).

## 2. Configure Settings

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Name** | `stream-reminders` | Or any name you prefer |
| **Region** | (Same as your database) | Keep close to DB for latency |
| **Schedule** | `*/14 * * * *` | Runs every 14 minutes |
| **Command** | `npx ts-node src/scripts/checkStreamReminders.ts` | Runs the script directly |

> **Note on Schedule**: We run every **14 minutes** to ensure we catch streams starting within the next **15-minute** window without gaps (since the script checks `now` to `now + 15m`).

## 3. Environment Variables
Your Cron Job needs access to the database and email services.
- If you use an **Environment Group** (recommended), link it to this Cron Job.
- Otherwise, copy these variables from your Web Service:
  - `DATABASE_URL`
  - `RESEND_API_KEY` (or your email provider key)
  - `FRONTEND_URL` (if specific notifications use it)

## 4. Create
Click **Create Cron Job**. It will now run automatically on your schedule!
