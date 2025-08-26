# Simple NFT Marketplace

A clean, modern, and easily deployable NFT marketplace powered by Manifold. Anyone can deploy this marketplace in minutes with minimal configuration required.

[Marketplace Preview, my series MEGACORPS used a similiar strategy for my block explorer artworks](https://megacorps.xyz)

## ✨ Features

- 🎨 **Clean Modern Design** - Beautiful, responsive UI that works on all devices
- ⚡ **Easy Configuration** - Simple `config.js` file for all customization
- 🔗 **Manifold Integration** - Built-in Web3 wallet connection and NFT claiming
- 🛒 **Shopping Cart** - Add multiple items and checkout in batch
- 📱 **Mobile Responsive** - Optimized for mobile and desktop
- 🚀 **Two Deployment Options** - Choose between simple upload or optimized single-file build
- 🎯 **Beginner Friendly** - No coding experience required

## 🚀 Quick Start

Choose your deployment method and follow the appropriate guide:

### For Plain Deployment (Recommended for beginners)

1. **Download** all files from the `simple-marketplace` folder
2. **Configure** your settings (see Configuration Guide below)
3. **Upload** to your web hosting service
4. **Done!** Your marketplace is live

### For Vite Single-File Build (Recommended for production)

1. **Download** all files from the `simple-marketplace` folder
2. **Install Node.js** if you haven't already
3. **Configure** your settings (see Configuration Guide below)
4. **Build**: Run `npm install` then `npm run build`
5. **Upload** the `dist/index.html` file to your hosting service
6. **Done!** Your optimized marketplace is live

## ⚙️ Essential Configuration

### 1. Get Your Manifold Client ID

1. Go to [Manifold Docs](https://docs.manifold.xyz/manifold-for-developers/guides/getting-started) and follow the steps to register your app and get your client ID
2. Connect your wallet and create an account
3. Create a new app or use an existing one
4. Copy your **Client ID** from the app settings

### 2. Configure Your Marketplace

Edit the `config.js` file:

```javascript
// Replace with your Manifold Client ID
clientId: "your-client-id-here",

// Update marketplace info
marketplace: {
    title: "Your Marketplace Name",
    description: "Your marketplace description"
}
```

### 3. Add Your NFT Collections

Edit the `claimids.js` file to add your collections:

```json
{
  "collections": [
    {
      "id": "your-collection-1",
      "claimId": "12345",
      "enabled": true,
      "customTitle": "Your Custom Title",
      "customDescription": "Your custom description",
      "customImage": "https://your-image-url.com/image.jpg",
      "mintButtonText": "Mint Now",
      "theme": "light"
    }
  ]
}
```

### 4. Set Up Your NFT Claims

1. In Manifold Studio, create your NFT claims
2. Copy the **Claim ID** (usually a number like 12345)
3. Add the claim ID to your `claimids.js` file (currently has my testnet claims for visual guidance.)
4. The marketplace will automatically fetch claim data from Manifold's API

### 5. Deploy!

Upload your files to any static hosting:

- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag & drop your folder
- **Vercel**: Import your project
- **Fleek Decentralized Hosting**: You can serve your page from IPFS like god intended with fleek's hosting service. Sadly the free tier has died but for decentralization maxis who will use the build: [FLEEK](https://hosting.fleek.xyz/dashboard/
)
- **Serve on IPFS with a hosting service like**: [Pinata](https://pinata.cloud/)



## 🚀 Deployment Options

You have **two ways** to deploy your marketplace, choose the one that fits your needs:

### Option 1: Plain Deployment (Easiest)

**Best for**: Beginners, quick setup, no build tools needed

**How it works**: Upload the files directly to any web hosting service

**Steps**:
1. Configure your `config.js` and `claimids.js` files
2. Upload all files to your hosting service
3. That's it! Your marketplace is live

- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag & drop your folder
- **Vercel**: Import your project
- **Fleek Decentralized Hosting**: You can serve your page from IPFS like god intended with fleek's hosting service. Sadly the free tier has died but for decentralization maxis who will use the build: [FLEEK](https://hosting.fleek.xyz/dashboard/
)
- **Serve on IPFS with a hosting service like**: [Pinata](https://pinata.cloud/)

**Pros**:
- ✅ No technical knowledge required
- ✅ No build process needed
- ✅ Easy to modify and update
- ✅ All files remain separate and editable

**Cons**:
- ⚠️ Multiple file requests (may be slower)
- ⚠️ Source code is visible

### Option 2: Vite Single-File Build (Optimized)

**Best for**: Production deployments, maximum performance, single-file distribution

**How it works**: Builds everything into one optimized HTML file

**Prerequisites**:
- Node.js installed on your computer
- Basic familiarity with terminal/command line

**Steps**:
1. Configure your `config.js` and `claimids.js` files
2. Install dependencies: `npm install`
3. Build single file: `npm run build`
4. Upload **only** the `dist/index.html` file to your hosting service OR use netlify/ vercel builds.

> 💡 **Note**: The build creates a single `dist/index.html` file that contains everything. You only need to upload this one file!

**Development**:
- Run dev server: `npm run dev` (with hot reload)
- Preview build: `npm run preview`

**Pros**:
- ✅ **Ultra-fast loading** - Everything in one file
- ✅ **Smaller file size** - Optimized and minified
- ✅ **Better caching** - Single file = better browser caching
- ✅ **Self-contained** - One file contains everything
- ✅ **Production-ready** - Optimized for performance

**Cons**:
- ⚠️ Requires Node.js and build step
- ⚠️ Need to rebuild after changes

### Which Option Should You Choose?

| Feature | Plain Deployment | Vite Single-File |
|---------|------------------|------------------|
| **Ease of Setup** | 🟢 Very Easy | 🟡 Moderate |
| **Performance** | 🟡 Good | 🟢 Excellent |
| **File Size** | 🟡 Larger | 🟢 Optimized |
| **Editability** | 🟢 Direct editing | 🟡 Rebuild required |
| **Technical Requirements** | 🟢 None | 🟡 Node.js |
| **Best For** | Beginners, quick setup | Production, performance |

**Recommendation**: 
- Start with **Plain Deployment** for initial setup and testing
- Switch to **Vite Single-File** for production deployment

### Vite Development Workflow

When using the Vite option, you get access to powerful development tools:

```bash
# Install dependencies (one time)
npm install

# Start development server with hot reload
npm run dev
# → Opens http://localhost:3000 with live updates

# Build optimized single file for production
npm run build
# → Creates dist/index.html ready for deployment

# Preview the production build locally
npm run preview
# → Test your built file before deploying
```

**Development Benefits**:
- 🔥 **Hot Module Replacement** - See changes instantly without page refresh
- ⚡ **Fast Builds** - Vite is extremely fast for both dev and build
- 🔍 **Better Debugging** - Source maps and dev tools
- 📦 **Optimized Output** - Minified, compressed, production-ready

## ⚙️ Configuration Guide

### Basic Settings

```javascript
marketplace: {
    title: "Your Marketplace Name",           // Appears in header
    description: "Your marketplace description",
    showConfigNotice: false                   // Hide config notice when ready
}
```

### Manifold Integration

```javascript
manifold: {
    clientId: "your-manifold-client-id",      // Required!
    network: "1",                             // 1=Ethereum, 11155111=Sepolia
    appName: "YourAppName",                   // For wallet connection
    multiWallet: false,                       // Allow multiple wallets
    autoReconnect: true                       // Auto-reconnect on page load
}
```

### Collection Setup (claimids.js)

Each collection in the JSON file needs:

```json
{
    "id": "unique-collection-id",             // Must be unique
    "claimId": "12345",                       // Manifold claim ID (number)
    "enabled": true,                          // Show/hide this collection
    "customTitle": "Custom Collection Name",  // Override fetched title (optional)
    "customDescription": "Custom description", // Override fetched description (optional)
    "customImage": "https://your-image.jpg",  // Override fetched image (optional)
    "mintButtonText": "Mint Now",             // Custom button text
    "theme": "light"                          // light or dark theme for widget
}
```

**Note**: Price, contract address, and other details are automatically fetched from Manifold's API using the claim ID. You can override the title, description, and image with custom values.

### UI Customization

```javascript
ui: {
    primaryColor: "#667eea",                 // Main color theme
    secondaryColor: "#764ba2",               // Accent color
    showPricesInCart: true,                  // Show prices in cart
    enableCart: true,                        // Enable shopping cart
    maxCartItems: 10,                        // Cart limit (0 = unlimited)
    showCollectionImages: true,              // Display images
    gridColumns: "auto"                      // auto, 1, 2, 3, or 4
}
```

## 🔧 Getting Manifold Information

### Finding Your Client ID

1. Go to [Manifold Studio](https://developer.manifoldxyz.dev/)
2. Sign in
3. Create your app.
4. Get the client name and ID
5. Copy the **Client ID** don't share your client secret.

### Finding Claim IDs

1. In Manifold Studio, go to **Claims**
2. Create a new claim or select an existing one
3. Look at the URL or claim details for the **Claim ID** (usually a number like 12345)
4. Add the claim ID to your `claimids.js` file
5. The marketplace will automatically fetch all claim details from Manifold's API

**Example**: If your claim URL is `https://studio.manifoldxyz.dev/claims/12345`, then your claim ID is `12345`.

### Testing Networks

For testing, use Sepolia testnet:
- Set `network: "11155111"` in config
- Get test ETH from [Google Sepolia Faucet]([https://sepoliafaucet.com/](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)) or your faucet of choosing.
- Create test claims in Manifold Studio

## 🚀 Deployment Options

### GitHub Pages (Free)

1. Create a new GitHub repository
2. Upload your marketplace files
3. Go to **Settings** → **Pages**
4. Select source branch (usually `main`)
5. Your site will be at `https://username.github.io/repository-name`

### Netlify (Free)

1. Go to [Netlify](https://netlify.com)
2. Drag your marketplace folder to the deploy area
3. OR instead of step 2, publish a private repo to github, and use the npm install && npm run build as the build command and use dist as the directory.
4. Get instant deployment with custom domain options

### Vercel (Free)

1. Go to [Vercel](https://vercel.com)
2. Import your project from GitHub or upload directly
3. Automatic deployments with each update

### Traditional Hosting

Upload via FTP to any web hosting provider:
- Shared hosting (GoDaddy, Bluehost, etc.)
- VPS or dedicated servers
- CDN services

## 🎨 Customization Tips

### Changing Colors

1. Edit `ui.primaryColor` and `ui.secondaryColor` in `config.js`
2. Or modify CSS custom properties in `styles.css`:

```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
}
```

### Adding Custom Styling

Add your custom CSS at the end of `styles.css`:

```css
/* Your custom styles */
.collection-card {
    border: 2px solid #your-color;
}
```

### Collection Images

- Use high-quality images (recommended: 400x300px or larger)
- Supported formats: JPG, PNG, GIF, WebP
- Use CDN/hosting with good performance
- Ensure CORS is enabled for external images

### Branding

- Replace favicon.ico with your logo
- Update page title in config
- Customize colors to match your brand
- Add your logo to the header in `index.html`

## 🐛 Troubleshooting

### "Configuration Required" Notice Won't Go Away

1. Make sure `clientId` is set in `config.js`
2. Check that your Client ID is valid
3. Set `showConfigNotice: false` in config to force hide

### Collections Not Showing

1. Check that `claimids.js` file exists and is properly formatted
2. Verify `enabled: true` for collections in the JSON file
3. Check that claim IDs are valid (numbers, not strings)
4. Look at browser console for API errors
5. Ensure claim IDs exist in Manifold Studio

### Mint Button Not Working

1. Ensure wallet is connected
2. Verify `app` and `claim` values in manifoldConfig
3. Check that claim is active in Manifold Studio
4. Try on correct network (mainnet vs testnet)

### Network Issues

1. Check `network` setting matches your claims
2. For mainnet: use `"1"`
3. For Sepolia testnet: use `"11155111"`
4. Ensure user's wallet is on correct network

### JSON Loading Errors

1. Ensure `claimids.js` is in the same folder as other files
2. Check JSON syntax is valid (use a JSON validator)
3. Verify file is uploaded to your hosting
4. Check browser console for fetch errors
5. Test locally first before deploying

### Cart Not Working

1. Check that `enableCart: true` in config
2. Verify JavaScript is enabled in browser
3. Check for JavaScript errors in console

## 📞 Support & Resources

- **Manifold Documentation**: [docs.manifoldxyz.dev](https://docs.manifold.xyz)
- **Manifold Help**: [Forum](https://forum.manifold.xyz)
- **GitHub Issues**: Report bugs or request features
- **Web3 Learning**: [ethereum.org/developers](https://ethereum.org/developers)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features  
- Submit improvements
- Share your marketplace!

---

**Happy Building! 🚀**

If you can, feel free to check out my block interactive token series: [MEGACORPS](https://megacorps.xyz)
Play with the tokens on Manifold: [MEGACORPS ON MANIFOLD](https://manifold.xyz/@srodan/contract/182841584)


Buying MEGACORPS artworks will help fund new ideas and act as a perpetual allowlist for future series that will build on them.

*Remember: Always test on testnets before deploying to mainnet!*
