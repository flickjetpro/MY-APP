# Cron Jobs Setup Guide

## Overview
We use cron-jobs.org to automatically trigger the data sync every 6 hours.

## Steps

### 1. Deploy Sync Engine to Vercel
```bash
cd sync-engine
vercel deploy --prod
```

### 2. Go to cron-jobs.org
- Create a free account at https://cron-jobs.org
- Click "Create Cronjob"

### 3. Configure the Cron Job
| Field | Value |
|-------|-------|
| URL | `https://your-sync-engine.vercel.app/trigger?secret=YOUR_SECRET` |
| Schedule | `0 */6 * * *` (every 6 hours) |
| Request Method | POST |
| Timeout | 300 seconds |
| Active | Yes |

### 4. Set Your Secret
Replace `YOUR_SECRET` in the URL with a random string.
Set the same string as `SYNC_SECRET` in your Vercel environment variables.

### 5. Environment Variables (Vercel)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key (NOT anon key) |
| `SYNC_SECRET` | Secret key for cron trigger auth |
| `DATA_DIR` | `./data` |
| `IPTV_MASTER_PATH` | `../../iptv-master` |

### 6. Verify
- After first cron run, check Supabase tables for populated data
- Check Vercel Function logs for sync output
