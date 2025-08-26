// =============================================
// SIMPLE MARKETPLACE CONFIGURATION
// =============================================
// Edit this file to customize your marketplace

import { claimData } from './claimids.js';

const MarketplaceConfig = {
    // ===================
    // BASIC SETTINGS
    // ===================
    marketplace: {
        title: "My NFT Marketplace",
        description: "A simple NFT marketplace powered by Manifold",
        // Set to false to hide the configuration notice
        showConfigNotice: true
    },

    // ===================
    // MANIFOLD SETTINGS
    // ===================
    manifold: {
        // Get your client ID from https://studio.manifoldxyz.dev/
        // IMPORTANT: Replace this with your own client ID
        clientId: "YOUR_CLIENT_ID_HERE", // Leave empty to show config notice
        
        // Network: 1 = Ethereum Mainnet, 5 = Goerli, 11155111 = Sepolia
        network: "NETWORK_HERE",
        
        // App name for Manifold connect widget
        appName: "SimpleMarketplace",
        
        // Multi-wallet support
        multiWallet: false,
        
        // Auto-reconnect on page load
        autoReconnect: false,
        
        // Fallback provider (optional)
        fallbackProvider: "wss://0xrpc.io/eth"
    },

    // ===================
    // COLLECTIONS/CLAIMS
    // ===================
    // Collections are now loaded from claimids.js
    // Edit claimids.js to configure your collections
    collections: [], // Will be populated from claimids.js

    // ===================
    // UI CUSTOMIZATION
    // ===================
    ui: {
        // Primary color (used for buttons, links, etc.)
        primaryColor: "#667eea",
        
        // Secondary color
        secondaryColor: "#764ba2",
        
        // Show prices in the cart
        showPricesInCart: true,
        
        // Enable shopping cart functionality
        enableCart: true,
        
        // Maximum items in cart (0 = unlimited)
        maxCartItems: 10,
        
        // Show collection images
        showCollectionImages: true,
        
        // Collection grid columns (auto, 1, 2, 3, 4)
        gridColumns: "auto"
    },

    // ===================
    // ADVANCED SETTINGS
    // ===================
    advanced: {
        // Enable console logging for debugging
        enableLogging: true,
        
        // Auto-hide config notice after successful setup
        autoHideConfigNotice: true,
        
        // Custom CSS classes
        customClasses: {
            container: "",
            collectionCard: "",
            cartSection: ""
        }
    }
};

// ===================
// CLAIM IDS LOADING
// ===================
MarketplaceConfig.loadClaimIds = async function() {
    try {
        if (!claimData || !claimData.collections || !Array.isArray(claimData.collections)) {
            throw new Error('Invalid claimids.js format: missing collections array');
        }
        
        // Store the raw claim configurations
        this.claimConfigs = claimData.collections.filter(claim => claim.enabled !== false);
        
        console.log(`Loaded ${this.claimConfigs.length} claim configurations from claimids.js`);
        return this.claimConfigs;
        
    } catch (error) {
        console.error('Error loading claim IDs:', error);
        throw error;
    }
};

MarketplaceConfig.fetchClaimData = async function(claimId) {
    try {
        const response = await fetch(`https://apps.api.manifoldxyz.dev/public/instance/data?id=${claimId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract data from the actual API response structure
        const publicData = data.publicData || {};
        const asset = publicData.asset || {};
        const contract = publicData.contract || {};
        const mintPrice = publicData.mintPrice || {};
        
        // Determine extension address based on contract spec
        const isERC1155 = contract.spec === 'ERC1155';
        const extensionAddress = isERC1155 
            ? publicData.extensionAddress1155?.value 
            : publicData.extensionAddress721?.value;
        
        // Check if claim is currently active
        const now = Date.now();
        const startDate = publicData.startDate;
        const isActive = startDate ? now >= startDate : true;
        
        // Parse and structure the claim data
        return {
            id: data.id || claimId,
            contractAddress: contract.contractAddress,
            price: mintPrice.value || '0',
            currency: mintPrice.symbol || 'ETH',
            walletMax: publicData.walletMax || 10,
            totalSupply: publicData.tokenSupply,
            currentSupply: null, // Not provided in API response
            extensionAddress: extensionAddress,
            title: asset.name || `Claim ${claimId}`,
            description: asset.description || publicData.description || '',
            imageUrl: asset.image_url || asset.image || '',
            startDate: startDate,
            endDate: null, // Not provided in API response
            isActive: isActive,
            // Additional parsed data
            priceInWei: mintPrice.value || '0',
            formattedPrice: this.formatPrice(mintPrice.value || '0', mintPrice.symbol || 'ETH'),
            // Store raw data for reference
            _rawData: data
        };
    } catch (error) {
        console.error(`Error fetching claim data for ${claimId}:`, error);
        throw error;
    }
};

MarketplaceConfig.formatPrice = function(priceWei, currency = 'ETH') {
    if (!priceWei || priceWei === '0') return 'Free';
    
    const priceEth = parseFloat(priceWei) / 1e18;
    return `${priceEth.toFixed(4)} ${currency}`;
};

MarketplaceConfig.buildCollectionFromClaim = function(claimConfig, claimData) {
    return {
        id: claimConfig.id,
        title: claimConfig.customTitle || claimData.title || `Collection ${claimConfig.claimId}`,
        description: claimConfig.customDescription || claimData.description || 'An NFT collection powered by Manifold',
        price: claimData.formattedPrice,
        priceInWei: claimData.priceInWei,
        image: claimData.imageUrl || claimConfig.customImage || 'https://via.placeholder.com/400x300/667eea/ffffff?text=NFT',
        
        // Manifold configuration
        manifoldConfig: {
            app: claimData.contractAddress,
            claim: claimConfig.claimId,
            theme: claimConfig.theme || 'light'
        },
        
        // UI configuration
        mintButtonText: claimConfig.mintButtonText || 'Mint Now',
        enabled: claimConfig.enabled !== false,
        
        // Raw claim data for reference
        _claimData: claimData,
        _claimConfig: claimConfig
    };
};

// ===================
// VALIDATION HELPERS
// ===================
MarketplaceConfig.isConfigured = function() {
    return this.manifold.clientId && this.manifold.clientId.length > 0;
};

MarketplaceConfig.getEnabledCollections = function() {
    return this.collections.filter(collection => collection.enabled);
};

MarketplaceConfig.getCollectionById = function(id) {
    return this.collections.find(collection => collection.id === id);
};

// Make config available globally
window.MarketplaceConfig = MarketplaceConfig;
