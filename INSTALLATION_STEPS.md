# How to Activate the Web Crawler Extension

## Step-by-Step Installation

### 1. Open Chrome Extensions Page
- Open Google Chrome
- Type in address bar: `chrome://extensions/`
- Press Enter

### 2. Enable Developer Mode
- Look for "Developer mode" toggle in the top-right corner
- Click to enable it (should turn blue/on)

### 3. Load the Extension
- Click the "Load unpacked" button (appears after enabling Developer mode)
- Navigate to: `C:\Users\NCPC\Documents\extension-crawl-data`
- Select this folder
- Click "Select Folder"

### 4. Verify Extension is Loaded
You should see:
- ✅ Extension card with name "Web Crawler DevTools"
- ✅ Version 1.0.0
- ✅ No error messages
- ✅ Toggle switch is ON (blue)

### 5. Test the Extension
- Open any website (e.g., https://google.com)
- Press `F12` to open DevTools
- Look for "Crawler" tab at the top of DevTools
- Click the "Crawler" tab
- You should see the Web Crawler panel

## Troubleshooting

### Extension Shows Errors
**Check for these files:**
- ✅ manifest.json
- ✅ devtools.html
- ✅ devtools.js
- ✅ panel.html
- ✅ panel.css
- ✅ panel.js
- ✅ background.js
- ✅ icons/icon16.png
- ✅ icons/icon48.png
- ✅ icons/icon128.png

**Solution:** All files should be in the correct location

### Extension is Disabled
- Click the toggle switch on the extension card to enable it
- If it won't enable, click "Remove" and reload it
- Make sure no antivirus is blocking it

### Crawler Tab Not Showing
- Refresh the webpage
- Close and reopen DevTools (F12)
- Make sure extension is enabled
- Try a different website

### Need to Reload After Changes
If you modify any files:
1. Go to `chrome://extensions/`
2. Find "Web Crawler DevTools"
3. Click the refresh icon (🔄) on the extension card
4. Close and reopen DevTools

## Quick Reload Shortcut
1. Keep `chrome://extensions/` open in a tab
2. After making changes, just click the refresh icon
3. No need to remove and re-add

## Verify Installation
Once installed, the extension should:
- ✅ Show "Crawler" tab in DevTools
- ✅ Display purple gradient header
- ✅ Show action buttons (Full Crawl, Extract Links, etc.)
- ✅ Show statistics cards with 0 values initially
- ✅ Have 5 tabs: Links, Images, Metadata, Network, Logs

## Common Issues

### Issue: "Manifest file is missing or unreadable"
**Fix:** Make sure manifest.json is in the root folder

### Issue: "Could not load background script"
**Fix:** Verify background.js exists in root folder

### Issue: "Could not load devtools_page"
**Fix:** Check that devtools.html exists in root folder

### Issue: Extension loads but panel is empty
**Fix:** Check browser console for JavaScript errors

## Need Help?
1. Check the Logs tab in the Crawler panel for error messages
2. Open browser console (F12 → Console) for errors
3. Verify all files are present
4. Try removing and reinstalling the extension

