# Web Crawler DevTools Extension

A powerful Chrome extension that adds an advanced web crawler panel to Chrome DevTools for extracting and analyzing web page data.

📖 **[Quick Usage Guide](USAGE_GUIDE.md)** - Get started in minutes!  
📋 **[Complete Feature List](FEATURES.md)** - See all 100+ features!

## Features

### Data Extraction
- **Link Extraction** - Extract all links with internal/external classification
- **Image Extraction** - Extract all images with dimensions and alt text
- **Metadata Extraction** - Extract SEO metadata, Open Graph tags, and Twitter Card data
- **Network Monitoring** - Capture and analyze network requests in real-time

### Analysis & Filtering
- Filter links by type (internal/external)
- Search functionality for links and images
- Real-time statistics dashboard
- Heading structure analysis
- Form and iframe detection

### Export Capabilities
- Export data to JSON format
- Export data to CSV format
- Organized data structure for easy analysis

### UI Features
- Modern tabbed interface
- Real-time activity logging
- Statistics dashboard with visual cards
- Responsive design
- Gradient styling

## Installation

### Load Unpacked Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the extension directory
5. The extension will be loaded and ready to use

### Using the Extension

1. Open Chrome DevTools (F12 or Right-click → Inspect)
2. Look for the "Crawler" tab in DevTools
3. Click on it to open the Web Crawler panel

#### Crawl Actions

**Full Crawl** - Extract all data (links, images, metadata) at once

**Extract Links** - Extract only links from the current page
- View internal vs external links
- Filter by link type
- Search links by URL or text

**Extract Images** - Extract all images from the page
- View image thumbnails
- See image dimensions
- Filter images by URL or alt text

**Extract Metadata** - Extract SEO and meta information
- Page title, description, keywords
- Open Graph tags
- Twitter Card data
- Canonical URL
- Heading structure (H1, H2, H3)
- Forms and iframe counts

**Export JSON** - Download all crawled data as JSON file

**Export CSV** - Download links and images as CSV file

**Clear All** - Reset all collected data

#### Tabs

- **Links** - View and filter extracted links
- **Images** - Browse extracted images in grid view
- **Metadata** - View complete page metadata
- **Network** - Monitor network requests (auto-captured)
- **Logs** - View activity logs and events

## File Structure

```
extension-crawl-data/
├── manifest.json          # Extension configuration
├── devtools.html          # DevTools entry point HTML
├── devtools.js            # DevTools panel creation
├── panel.html             # Panel UI structure
├── panel.css              # Panel styling
├── panel.js               # Panel functionality
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Use Cases

- **SEO Analysis** - Extract and analyze meta tags, headings, and structure
- **Competitive Research** - Analyze competitor websites and extract data
- **Link Building** - Find and export all links from web pages
- **Content Auditing** - Analyze page structure and content elements
- **Web Scraping** - Extract structured data for further processing
- **QA Testing** - Verify page metadata and link integrity

## Customization

### Modify Panel Appearance

Edit `panel.css` to change colors, layout, and styling. The extension uses CSS variables and modern gradients for easy customization.

### Add New Extraction Features

Edit `panel.js` to add new data extraction capabilities. The code is organized with separate functions for each extraction type.

### Change Panel Name

Update the panel name in `devtools.js`:

```javascript
chrome.devtools.panels.create(
  "Your Panel Name",
  "icons/icon16.png",
  "panel.html",
  function(panel) { ... }
);
```

## Technical Details

### Chrome APIs Used

- `chrome.devtools.panels` - Create custom DevTools panels
- `chrome.devtools.inspectedWindow.eval` - Execute code in inspected page context
- `chrome.devtools.network.onRequestFinished` - Monitor network requests
- `chrome.devtools.network.onNavigated` - Detect page navigation
- `chrome.runtime` - Handle extension lifecycle events
- `chrome.tabs` - Monitor tab updates

### Data Structure

The extension maintains a `crawlData` object containing:

```javascript
{
  links: [],      // Array of link objects
  images: [],     // Array of image objects
  metadata: {},   // Page metadata object
  network: [],    // Network requests array
  stats: {        // Statistics object
    totalLinks: 0,
    totalImages: 0,
    externalLinks: 0,
    scripts: 0
  }
}
```

## Development

### Requirements

- Google Chrome (latest version)
- Text editor or IDE

### Testing

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the reload icon for your extension
4. Reopen DevTools to see changes

## Troubleshooting

### Panel not showing up

- Ensure the extension is enabled in `chrome://extensions/`
- Check for errors in the extension's service worker logs
- Reload the extension and refresh the page

### Icon not displaying

- Add icon files to the `icons/` directory
- Icons should be PNG format in sizes: 16x16, 48x48, 128x128
- Update paths in `manifest.json` if using different names

## License

MIT License - Feel free to modify and use as needed.

