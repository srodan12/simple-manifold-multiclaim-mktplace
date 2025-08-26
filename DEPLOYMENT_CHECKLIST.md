# 🚀 Deployment Checklist

Use this checklist to ensure your marketplace is properly configured and ready to deploy.

## ✅ Pre-Deployment Checklist

### 1. Manifold Setup
- [ ] Created account at [Manifold Studio](https://studio.manifoldxyz.dev/)
- [ ] Created or have access to an app
- [ ] Copied Client ID from app settings
- [ ] Created NFT claims in Manifold Studio
- [ ] Copied App Address and Claim IDs

### 2. Configuration
- [ ] Opened `config.js` file
- [ ] Added your Manifold Client ID
- [ ] Updated marketplace title and description
- [ ] Configured at least one collection with:
  - [ ] Unique ID
  - [ ] Title and description
  - [ ] Price (both display and wei)
  - [ ] Image URL
  - [ ] Manifold app address
  - [ ] Manifold claim ID
- [ ] Set correct network (1 for mainnet, 11155111 for Sepolia testnet)
- [ ] Customized UI colors (optional)

### 3. Testing
- [ ] Opened `index.html` in browser locally
- [ ] Verified marketplace loads without errors
- [ ] Checked that collections display correctly
- [ ] Tested wallet connection (if possible locally)
- [ ] Verified configuration notice is hidden (if configured)

### 4. Deployment Platform
Choose one:
- [ ] **GitHub Pages**: Repository created, files uploaded, Pages enabled
- [ ] **Netlify**: Signed up, files uploaded via drag-and-drop
- [ ] **Vercel**: Account created, project imported/uploaded
- [ ] **Traditional Hosting**: Files uploaded via FTP

### 5. Post-Deployment Testing
- [ ] Visited live marketplace URL
- [ ] Verified all collections load correctly
- [ ] Tested wallet connection
- [ ] Attempted to mint/claim an NFT
- [ ] Tested shopping cart functionality
- [ ] Checked mobile responsiveness

### 6. Final Steps
- [ ] Set `showConfigNotice: false` in config.js (optional)
- [ ] Added custom branding/logo (optional)
- [ ] Configured custom domain (optional)
- [ ] Shared marketplace with others! 🎉

## 🔧 Common Issues & Quick Fixes

### Configuration Notice Still Showing
```javascript
// In config.js, ensure:
clientId: "your-actual-client-id-here", // Not empty!
// AND/OR
marketplace: {
    showConfigNotice: false // Force hide
}
```

### Collections Not Displaying
```javascript
// Check each collection has:
{
    id: "unique-id",           // ✅ Must be unique
    title: "Title",            // ✅ Required
    price: "0.01 ETH",         // ✅ Required
    priceInWei: "10000...",    // ✅ Required (wei format)
    manifoldConfig: {
        app: "0x123...",       // ✅ Required (app address)
        claim: "1"             // ✅ Required (claim ID)
    },
    enabled: true              // ✅ Must be true
}
```

### Mint Button Not Working
1. Check wallet is connected
2. Verify you're on correct network
3. Ensure claim is active in Manifold Studio
4. Check app address and claim ID are correct

### Network Mismatch
```javascript
// For Ethereum mainnet:
network: "1"

// For Sepolia testnet:
network: "11155111"
```

## 📋 File Organization

Make sure your deployment includes all files:
```
your-marketplace/
├── index.html              ✅ Required
├── styles.css              ✅ Required  
├── config.js               ✅ Required
├── marketplace.js          ✅ Required
├── README.md               📖 Helpful
└── DEPLOYMENT_CHECKLIST.md 📖 This file
```

## 🎯 Testing Networks

### Sepolia Testnet (Recommended for Testing)
- Network: `"11155111"`
- Get test ETH: [Sepolia Faucet](https://sepoliafaucet.com/)
- Free to test, no real money involved

### Ethereum Mainnet (Production)
- Network: `"1"`
- Real ETH required
- Test thoroughly on testnet first!

## 🚀 Ready to Launch?

If you've checked all the boxes above, you're ready to share your marketplace with the world!

### Share Your Success
- Tweet about your new marketplace
- Share in NFT/Web3 communities
- Tell your friends and collectors
- Consider joining the Manifold Discord to share

---

**Need Help?** 
- Check the main README.md for detailed instructions
- Visit [Manifold Documentation](https://docs.manifoldxyz.dev)
- Ask questions in [Manifold Discord](https://discord.gg/manifoldxyz)

**Good luck with your launch! 🚀✨**
