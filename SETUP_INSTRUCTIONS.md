# IL-9 Voter Guide - Setup Instructions

## Step 1: Add Your Airtable Personal Access Token

1. Open the file `voter-guide-live.jsx`
2. Look for line 8 where it says:
   ```javascript
   personalAccessToken: 'YOUR_TOKEN_HERE',
   ```
3. Replace `YOUR_TOKEN_HERE` with your actual token (it starts with "pat...")
4. Save the file

Example:
```javascript
personalAccessToken: 'patAbcXyz123456789',
```

## Step 2: Deploy to Vercel (Free Hosting)

### Option A: Deploy via Vercel Website (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign up/login (use GitHub account)
2. Click "Add New..." → "Project"
3. Import from GitHub (or upload the project folder)
4. Vercel will auto-detect it's a React app
5. Click "Deploy"
6. Done! You'll get a URL like `il9-voter-guide.vercel.app`

### Option B: Deploy via Command Line

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. In your project folder, run:
   ```bash
   vercel
   ```

3. Follow the prompts (login, confirm settings)
4. Deploy!

## Step 3: Updating Your Data

Whenever you want to update candidate positions:

1. Go to your Airtable base
2. Edit the data (add rows, update statements, etc.)
3. Changes appear on your website automatically!
4. If you want to force a refresh, click the "Refresh" button on the website

## Security Note

Your Personal Access Token is embedded in the code. This is fine for a public voter guide where the data is meant to be public anyway. 

If you want extra security:
- You can revoke and regenerate tokens anytime in Airtable
- Consider using Vercel Environment Variables (ask me if you want help with this!)

## Need Help?

- Vercel deployment issues: Check Vercel docs at vercel.com/docs
- Airtable questions: Check airtable.com/support
- Code questions: Come back and ask me!

## Next Steps

Once deployed, you can:
1. Share the URL with voters
2. Embed it in your WordPress site using an iframe
3. Add custom domain (via Vercel settings)
4. Keep updating data in Airtable as the campaign continues
