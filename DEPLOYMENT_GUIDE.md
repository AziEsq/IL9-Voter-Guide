# Quick Deployment Guide

## Files to Upload to GitHub

Upload these files to your GitHub repository:

### Root Directory:
- `.gitignore`
- `package.json`
- `index.html`
- `vite.config.js`
- `README.md`

### src/ Directory:
- `src/main.jsx`
- `src/index.css`
- `src/VoterGuide.jsx`
- `src/config.js` ⬅️ **IMPORTANT: Add your token here first!**

## Before Uploading:

1. **Edit `src/config.js`:**
   - Open the file
   - Find line 3: `personalAccessToken: 'YOUR_TOKEN_HERE',`
   - Replace `YOUR_TOKEN_HERE` with your actual Airtable token
   - Save the file

2. **Upload everything to GitHub:**
   - Drag and drop all files to your GitHub repository
   - Make sure the folder structure matches (src/ folder with files inside)

3. **Vercel will auto-deploy:**
   - Vercel watches your GitHub repo
   - Any changes trigger automatic deployment
   - Wait 30-60 seconds for deployment to complete

## Updating Data:

- Edit your Airtable base anytime
- Changes appear on your website immediately
- Users may need to refresh their browser

## Updating Code:

When you want to change the code:
1. Download the updated files
2. Upload them to GitHub (drag and drop)
3. Vercel auto-deploys the changes
4. Your `config.js` with token stays the same (no need to re-enter it)

## Current Features:

✅ Independent scrolling for candidate and topic filters
✅ Responsive mobile design
✅ Cards and Table view modes
✅ Real-time data from Airtable
✅ Source citations
✅ Filter by multiple candidates and topics

## Need Help?

If something breaks:
1. Check Vercel deployment logs
2. Check browser console for errors (F12)
3. Verify your Airtable token is correct
4. Make sure all files are in the right folders
