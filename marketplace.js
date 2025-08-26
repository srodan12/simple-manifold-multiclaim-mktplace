// =============================================
// SIMPLE MARKETPLACE - MAIN FUNCTIONALITY
// =============================================

class SimpleMarketplace {
    constructor() {
        this.cart = [];
        this.isAuthenticated = false;
        this.connectedWalletAddress = null;
        this.currentNetwork = null;
        this.manifoldProvider = null;
        this.isProviderInitialized = false;
        this.config = window.MarketplaceConfig;
        this.userOwnedTokens = [];
        this.currentPage = 'marketplace'; // 'marketplace' or 'collection'
        
        this.init();
    }

    init() {
        this.log('Initializing Simple Marketplace...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.applyConfiguration();
        this.setupEventListeners();
        await this.loadAndRenderCollections();
        this.setupManifoldIntegration();
        this.updateConfigNotice();
        
        // Make variables globally accessible for debugging (like example file)
        window.marketplace = this;
        window.isAuthenticated = this.isAuthenticated;
        window.connectedWalletAddress = this.connectedWalletAddress;
        window.syncManifoldAuth = () => this.syncManifoldAuth();
        
        this.log('Marketplace initialized successfully');
    }

    // ===================
    // CONFIGURATION
    // ===================
    applyConfiguration() {
        // Update page title
        if (this.config.marketplace.title) {
            document.title = this.config.marketplace.title;
            const titleElement = document.querySelector('.marketplace-title');
            if (titleElement) {
                titleElement.textContent = this.config.marketplace.title;
            }
        }

        // Apply custom CSS variables if needed
        if (this.config.ui.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', this.config.ui.primaryColor);
        }

        // Update Manifold connect widget
        const connectWidget = document.querySelector('[data-widget="m-connect"]');
        if (connectWidget && this.config.manifold.clientId) {
            connectWidget.setAttribute('data-client-id', this.config.manifold.clientId);
            connectWidget.setAttribute('data-app-name', this.config.manifold.appName);
            connectWidget.setAttribute('data-network', this.config.manifold.network);
            connectWidget.setAttribute('data-multi', this.config.manifold.multiWallet.toString());
            connectWidget.setAttribute('data-auto-reconnect', this.config.manifold.autoReconnect.toString());
            
            if (this.config.manifold.fallbackProvider) {
                connectWidget.setAttribute('data-fallback-provider', this.config.manifold.fallbackProvider);
            }
        }
    }

    updateConfigNotice() {
        const configNotice = document.getElementById('config-notice');
        if (!configNotice) return;

        const isConfigured = this.config.isConfigured();
        const autoHide = this.config.advanced.autoHideConfigNotice;
        const showNotice = this.config.marketplace.showConfigNotice;
        
        this.log('Config Notice Debug:');
        this.log('- isConfigured:', isConfigured);
        this.log('- autoHideConfigNotice:', autoHide);
        this.log('- showConfigNotice:', showNotice);
        this.log('- clientId:', this.config.manifold.clientId ? 'Present' : 'Missing');

        if (isConfigured && autoHide) {
            this.log('Hiding config notice (auto-detection)');
            configNotice.style.display = 'none';
        } else if (!showNotice) {
            this.log('Hiding config notice (manual override)');
            configNotice.style.display = 'none';
        } else {
            this.log('Keeping config notice visible');
        }
    }

    // ===================
    // PROVIDER DETECTION & SETUP  
    // ===================
    async isProviderAvailable() {
        try {
            return window.ethereum && typeof window.ethereum.request === 'function';
        } catch (error) {
            return false;
        }
    }

    async getProvider() {
        if (!window.ethereum || typeof window.ethereum.request !== 'function') {
            throw new Error('No compatible Ethereum provider available');
        }
        return window.ethereum;
    }

    syncManifoldAuth() {
        this.log('Syncing manifold authentication...');
        
        if (window.manifold && window.manifold.isAuthenticated && window.manifold.dataClient) {
            this.log('Found manifold.dataClient - syncing...');
            this.isAuthenticated = true;
            // Get wallet address if available
            if (window.manifold.dataClient.walletAddress) {
                this.connectedWalletAddress = window.manifold.dataClient.walletAddress;
            }
            this.updateConnectionState();
            this.log('Authentication synced successfully');
        }
    }

    updateConnectionState() {
        const isConnected = this.isAuthenticated && this.connectedWalletAddress;
        this.log('Connection state updated:', { 
            isAuthenticated: this.isAuthenticated, 
            connectedWalletAddress: this.connectedWalletAddress,
            isConnected 
        });
        
        // Update global variables for debugging (like example file)
        if (typeof window !== 'undefined') {
            window.isAuthenticated = this.isAuthenticated;
            window.connectedWalletAddress = this.connectedWalletAddress;
            window.userOwnedTokens = this.userOwnedTokens;
        }

        this.updateNavigationVisibility();
    }

    // ===================
    // NETWORK MANAGEMENT
    // ===================
    async checkAndSwitchNetwork() {
        const providerAvailable = await this.isProviderAvailable();
        if (!providerAvailable) {
            throw new Error('No wallet detected');
        }

        try {
            const currentChainId = await this.makeProviderRequest('eth_chainId');
            // Convert config network from decimal to hex
            const targetNetworkDecimal = parseInt(this.config.manifold.network);
            const targetChainId = '0x' + targetNetworkDecimal.toString(16);
            
            // Get network info for better user experience
            const networkInfo = this.getNetworkInfo(targetNetworkDecimal);
            
            this.log('Current chain ID:', currentChainId);
            this.log('Target chain ID:', targetChainId, `(${networkInfo.name})`);

            if (currentChainId !== targetChainId) {
                this.log(`Wrong network detected, requesting switch to ${networkInfo.name}...`);
                
                try {
                    // Try to switch to target network
                    await this.makeProviderRequest('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
                    this.showCartFeedback(`Switched to ${networkInfo.name}`, 'success');
                    return true;
                } catch (switchError) {
                    this.log('Switch failed:', switchError);
                    
                    // If switch failed, try to add the network
                    if (switchError.code === 4902) {
                        this.log('Network not found, attempting to add...');
                        try {
                            await this.makeProviderRequest('wallet_addEthereumChain', [{
                                chainId: targetChainId,
                                chainName: networkInfo.name,
                                nativeCurrency: networkInfo.nativeCurrency,
                                rpcUrls: networkInfo.rpcUrls,
                                blockExplorerUrls: networkInfo.blockExplorerUrls
                            }]);
                            this.showCartFeedback(`Added and switched to ${networkInfo.name}`, 'success');
                            return true;
                        } catch (addError) {
                            this.log('Failed to add network:', addError);
                            throw new Error(`Failed to switch to required network: ${networkInfo.name}`);
                        }
                    } else {
                        throw new Error(`Please switch to ${networkInfo.name} manually`);
                    }
                }
            }

            this.log(`Already on correct network: ${networkInfo.name}`);
            return true;
        } catch (error) {
            this.log('Network check failed:', error);
            throw error;
        }
    }

    getNetworkInfo(networkId) {
        const networks = {
            1: {
                name: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.infura.io/v3/', 'https://eth-mainnet.alchemyapi.io/v2/'],
                blockExplorerUrls: ['https://etherscan.io/']
            },
            5: {
                name: 'Goerli Testnet',
                nativeCurrency: { name: 'Goerli Ether', symbol: 'GoerliETH', decimals: 18 },
                rpcUrls: ['https://goerli.infura.io/v3/', 'https://eth-goerli.alchemyapi.io/v2/'],
                blockExplorerUrls: ['https://goerli.etherscan.io/']
            },
            11155111: {
                name: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/', 'https://eth-sepolia.g.alchemy.com/v2/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
            },
            137: {
                name: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/', 'https://rpc-mainnet.matic.network'],
                blockExplorerUrls: ['https://polygonscan.com/']
            },
            80001: {
                name: 'Polygon Mumbai',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com/', 'https://matic-mumbai.chainstacklabs.com'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }
        };

        return networks[networkId] || {
            name: `Network ${networkId}`,
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [''],
            blockExplorerUrls: ['']
        };
    }

    // ===================
    // BLOCKCHAIN TRANSACTIONS
    // ===================
    async makeProviderRequest(method, params = []) {
        try {
            const provider = await this.getProvider();
            if (!provider || typeof provider.request !== 'function') {
                throw new Error('Provider not available or does not support requests');
            }
            return await provider.request({ method, params });
        } catch (error) {
            this.log(`Provider request failed (${method}):`, error);
            throw error;
        }
    }

    async executePurchase(claimData, quantity, userAddress) {
        try {
            // Get the contract address and extension address from claim data
            const contractAddress = claimData.contractAddress;
            let extensionAddress = claimData.extensionAddress;
            
            const pricePerToken = claimData.priceInWei || '0';
            const walletMax = claimData.walletMax || 1;

            this.log('Purchase execution details:', {
                contractAddress,
                extensionAddress,
                pricePerToken,
                quantity,
                userAddress
            });

            if (!contractAddress || !extensionAddress) {
                throw new Error('Missing contract or extension address');
            }

            // Calculate total value: (token price * quantity) + (Manifold platform fee * quantity)
            const tokenCost = BigInt(pricePerToken) * BigInt(quantity);
            const manifoldFeePerToken = BigInt('500000000000000'); // 0.0005 ETH in wei
            const totalManifoldFees = manifoldFeePerToken * BigInt(quantity);
            const totalValue = tokenCost + totalManifoldFees;

            // Log costs for user reference
            const tokenCostEth = Number(tokenCost) / Math.pow(10, 18);
            const manifoldFeesEth = Number(totalManifoldFees) / Math.pow(10, 18);
            const totalValueEth = Number(totalValue) / Math.pow(10, 18);

            this.log('Transaction cost breakdown:', {
                tokenCost: `${tokenCostEth} ETH`,
                manifoldFees: `${manifoldFeesEth} ETH`,
                totalValue: `${totalValueEth} ETH`
            });

            // Choose between mint (single) or mintBatch (multiple) based on quantity
            let mintData;
            if (quantity === 1) {
                mintData = this.encodeMintFunction(contractAddress, claimData.id, userAddress);
            } else {
                mintData = this.encodeMintBatchFunction(contractAddress, claimData.id, quantity, userAddress);
            }

            // Prepare transaction parameters
            const transactionParams = {
                from: userAddress.toLowerCase(),
                to: extensionAddress.toLowerCase(),
                value: '0x' + totalValue.toString(16),
                data: mintData,
                gas: '0x' + (300000 + (quantity * 50000)).toString(16) // Base gas + per-token gas
            };

            this.log('Sending transaction:', transactionParams);

            // Send the transaction to the extension contract
            const txHash = await this.makeProviderRequest('eth_sendTransaction', [transactionParams]);
            
            this.log('Transaction sent:', txHash);
            return txHash;

        } catch (error) {
            this.log('Purchase execution failed:', error);
            throw error;
        }
    }

    encodeMintFunction(creatorContractAddress, instanceId, mintFor) {
        // Function signature: mint(address creatorContractAddress, uint256 instanceId, uint32 mintIndex, bytes32[] merkleProof, address mintFor)
        const functionSignature = '0xfa2b068f';

        // Convert and pad parameters
        const paddedCreatorAddress = creatorContractAddress.toLowerCase().replace('0x', '').padStart(64, '0');
        const paddedInstanceId = BigInt(instanceId).toString(16).padStart(64, '0');
        const paddedMintIndex = '0'.padStart(64, '0'); // Always 0
        const paddedMintFor = mintFor.toLowerCase().replace('0x', '').padStart(64, '0');

        // Merkle proof offset (points to empty array)
        const merkleProofOffset = (32 * 5).toString(16).padStart(64, '0'); // 160 bytes
        const merkleProofLength = '0'.padStart(64, '0'); // Empty array

        const fullData = functionSignature +
            paddedCreatorAddress +
            paddedInstanceId +
            paddedMintIndex +
            merkleProofOffset +
            paddedMintFor +
            merkleProofLength;

        return fullData;
    }

    encodeMintBatchFunction(creatorContractAddress, instanceId, mintCount, mintFor) {
        // Function signature: mintBatch(address creatorContractAddress, uint256 instanceId, uint16 mintCount, uint32[] mintIndices, bytes32[][] merkleProofs, address mintFor)
        const functionSignature = '0x26c858a4';

        const cleanCreatorAddress = String(creatorContractAddress).toLowerCase();
        const cleanMintFor = String(mintFor).toLowerCase();

        // Convert and pad parameters
        const paddedCreatorAddress = cleanCreatorAddress.replace('0x', '').padStart(64, '0');
        const paddedInstanceId = BigInt(instanceId).toString(16).padStart(64, '0');
        const paddedMintCount = mintCount.toString(16).padStart(64, '0');
        const paddedMintFor = cleanMintFor.replace('0x', '').padStart(64, '0');

        // Dynamic array offsets
        const mintIndicesOffset = (32 * 6).toString(16).padStart(64, '0');
        const merkleProofsOffset = (32 * 6 + 32 + mintCount * 32).toString(16).padStart(64, '0');

        // Mint indices array (all zeros)
        const mintIndicesLength = mintCount.toString(16).padStart(64, '0');
        const mintIndicesData = Array(mintCount).fill('0'.padStart(64, '0')).join('');

        // Merkle proofs array (empty arrays)
        const merkleProofsLength = mintCount.toString(16).padStart(64, '0');
        const merkleProofOffsets = Array(mintCount).fill(0).map((_, i) => 
            (32 * mintCount + i * 32).toString(16).padStart(64, '0')
        ).join('');
        const merkleProofData = Array(mintCount).fill('0'.padStart(64, '0')).join('');

        const fullData = functionSignature +
            paddedCreatorAddress +
            paddedInstanceId +
            paddedMintCount +
            mintIndicesOffset +
            merkleProofsOffset +
            paddedMintFor +
            mintIndicesLength +
            mintIndicesData +
            merkleProofsLength +
            merkleProofOffsets +
            merkleProofData;

        return fullData;
    }

    showCartFeedback(message, type = 'success', txHash = null, isProcessing = false) {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = 'cart-feedback';

        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        feedback.appendChild(messageDiv);

        // Add etherscan link for transactions (both processing and completed)
        if (txHash) {
            const linkDiv = document.createElement('div');
            linkDiv.style.marginTop = '8px';

            const etherscanLink = document.createElement('a');
            const baseUrl = 'https://etherscan.io'; // Ethereum mainnet
            etherscanLink.href = `${baseUrl}/tx/${txHash}`;
            etherscanLink.target = '_blank';
            etherscanLink.textContent = 'View on Etherscan';
            etherscanLink.style.cssText = `
                color: #667eea;
                text-decoration: underline;
                font-size: 12px;
            `;

            linkDiv.appendChild(etherscanLink);
            feedback.appendChild(linkDiv);
        }

        const backgroundColor = type === 'error' ? '#dc3545' : '#667eea';

        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 500;
            z-index: 1001;
            animation: slideInFade 0.3s ease-out;
            max-width: 350px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(feedback);

        // Determine duration based on type and content
        let duration;
        if (type === 'error') {
            // Longer duration for errors, especially if they contain detailed error messages
            duration = message.length > 50 ? 8000 : 5000;
        } else if (isProcessing) {
            // Don't auto-hide processing messages
            duration = null;
        } else {
            duration = 3000;
        }

        // Store reference for manual removal if needed
        feedback.remove = () => {
            if (feedback.parentNode) {
                feedback.style.animation = 'slideOutFade 0.3s ease-in';
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.parentNode.removeChild(feedback);
                    }
                }, 300);
            }
        };

        if (duration) {
            setTimeout(() => {
                feedback.remove();
            }, duration);
        }

        return feedback;
    }

    // ===================
    // EVENT LISTENERS
    // ===================
    setupEventListeners() {
        // Cart functionality
        const clearCartBtn = document.getElementById('clear-cart');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }

        // Listen for Manifold authentication events (like example file)
        window.addEventListener('m-authenticated', (event) => {
            this.log('Wallet authenticated:', event.detail);
            this.isAuthenticated = true;
            if (event.detail && event.detail.address) {
                this.connectedWalletAddress = event.detail.address;
            }
            this.updateConnectionState();
            this.checkTokenOwnership();
        });

        window.addEventListener('m-unauthenticated', (event) => {
            this.log('Wallet unauthenticated:', event.detail);
            this.isAuthenticated = false;
            this.connectedWalletAddress = null;
            this.userOwnedTokens = [];
            this.updateConnectionState();
            this.updateNavigationVisibility();
        });

        // Check if wallet is already authenticated on load
        setTimeout(() => {
            if (window.manifold && window.manifold.isAuthenticated) {
                this.log('Wallet already authenticated on load');
                this.syncManifoldAuth();
            }
        }, 1000);
    }

    // ===================
    // COLLECTIONS LOADING & RENDERING
    // ===================
    async loadAndRenderCollections() {
        const collectionsGrid = document.getElementById('collections-grid');
        if (!collectionsGrid) return;

        try {
            // Show loading state
            collectionsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                    <p>Loading collections...</p>
                </div>
            `;

            // Load claim configurations from JSON
            const claimConfigs = await this.config.loadClaimIds();
            
            if (claimConfigs.length === 0) {
                collectionsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                        <p>No collections found in claimids.js. Please add your claim IDs to the file.</p>
                    </div>
                `;
                return;
            }

            // Fetch claim data for each configuration
            this.log(`Fetching claim data for ${claimConfigs.length} claims...`);
            const collections = [];
            
            for (const claimConfig of claimConfigs) {
                try {
                    this.log(`Fetching claim data for ID: ${claimConfig.claimId}`);
                    const claimData = await this.config.fetchClaimData(claimConfig.claimId);
                    this.log(`Raw claim data for ${claimConfig.claimId}:`, claimData);
                    const collection = this.config.buildCollectionFromClaim(claimConfig, claimData);
                    this.log(`Built collection for ${claimConfig.claimId}:`, collection);
                    collections.push(collection);
                    this.log(`Successfully loaded: ${collection.title}`);
                } catch (error) {
                    this.log(`Failed to load claim ${claimConfig.claimId}:`, error.message);
                    // Create a fallback collection for failed claims
                    const fallbackCollection = this.createFallbackCollection(claimConfig, error);
                    if (fallbackCollection) {
                        collections.push(fallbackCollection);
                    }
                }
            }

            // Store collections in config for later use
            this.config.collections = collections;
            
            // Render collections
            this.renderCollections(collections);

        // Initialize Manifold widgets after rendering
        setTimeout(() => {
            if (window.manifoldWidgets && typeof window.manifoldWidgets.createClaimWidgets === 'function') {
                window.manifoldWidgets.createClaimWidgets();
                this.log('Manifold claim widgets initialized');
            }
        }, 500);
            
        } catch (error) {
            this.log('Error loading collections:', error);
            collectionsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #dc3545;">
                    <h3>⚠️ Error Loading Collections</h3>
                    <p>Failed to load claimids.js: ${error.message}</p>
                    <p>Please check that the file exists and is properly formatted.</p>
                </div>
            `;
        }
    }

    renderCollections(collections) {
        const collectionsGrid = document.getElementById('collections-grid');
        if (!collectionsGrid) return;

        const enabledCollections = collections.filter(collection => collection.enabled);
        
        if (enabledCollections.length === 0) {
            collectionsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                    <p>All collections are disabled. Please check your claimids.js configuration.</p>
                </div>
            `;
            return;
        }

        collectionsGrid.innerHTML = enabledCollections.map(collection => 
            this.renderCollectionCard(collection)
        ).join('');

        // Setup event listeners for collection cards
        this.setupCollectionEventListeners();
    }

    createFallbackCollection(claimConfig, error) {
        // Only create fallback if explicitly enabled
        if (claimConfig.enabled === false) return null;
        
        return {
            id: claimConfig.id,
            title: claimConfig.customTitle || `Collection ${claimConfig.claimId}`,
            description: claimConfig.customDescription || `Failed to load claim data: ${error.message}`,
            price: 'Unknown',
            priceInWei: '0',
            image: claimConfig.customImage || 'https://via.placeholder.com/400x300/ccc/666?text=Error+Loading',
            
            manifoldConfig: {
                app: 'unknown',
                claim: claimConfig.claimId,
                theme: claimConfig.theme || 'light'
            },
            
            mintButtonText: claimConfig.mintButtonText || 'Unavailable',
            enabled: false, // Disable failed collections
            isError: true
        };
    }

    renderCollectionCard(collection) {
        const imageHtml = this.config.ui.showCollectionImages ? 
            `<img src="${collection.image}" alt="${collection.title}" class="collection-image" onerror="this.style.display='none'">` : 
            `<div class="collection-image"></div>`;

        const isError = collection.isError || !collection.enabled;
        const cardClass = isError ? 'collection-card error-card' : 'collection-card';
        const buttonsDisabled = isError ? 'disabled' : '';

        // Add mint count widget if we have claim data
        const mintCountWidget = !isError && collection._claimData ? 
            `<div class="mint-count-widget" data-widget="m-claim-mint-count" data-id="${collection.manifoldConfig.claim}">MINTED: --/--</div>` : 
            '';

        return `
            <div class="${cardClass} ${this.config.advanced.customClasses.collectionCard}" data-collection-id="${collection.id}">
                ${imageHtml}
                <div class="collection-info">
                    <h3 class="collection-title">${collection.title}</h3>
                    <p class="collection-description">${collection.description}</p>
                    <div class="collection-price">${collection.price}</div>
                    ${mintCountWidget}
                    ${isError ? '<div class="error-notice">⚠️ Collection unavailable</div>' : ''}
                    <div class="collection-actions">
                        ${!isError ? 
                            `<button class="add-to-cart-btn" data-collection-id="${collection.id}">Add to Cart</button>` : 
                            '<button class="mint-now-btn disabled" disabled>Unavailable</button>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    setupCollectionEventListeners() {
        // Add to cart buttons (handles both add to cart and mint now functionality)
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const collectionId = e.target.getAttribute('data-collection-id');
                this.addToCart(collectionId);
            });
        });

        // Legacy mint now buttons for backward compatibility
        document.querySelectorAll('.mint-now-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const collectionId = e.target.getAttribute('data-collection-id');
                this.addToCart(collectionId); // Changed to add to cart instead of modal
            });
        });
    }

    // ===================
    // CART FUNCTIONALITY
    // ===================
    addToCart(collectionId) {
        const collection = this.config.getCollectionById(collectionId);
        if (!collection) {
            this.showCartFeedback('Collection not found', 'error');
            return;
        }

        // Check if claim data is available
        if (!collection._claimData) {
            this.showCartFeedback('Claim data not available for this collection', 'error');
            return;
        }

        const walletMax = collection._claimData.walletMax || 1;
        const itemName = collection.title;

        // Check if item is already in cart
        const existingItem = this.cart.find(item => item.id === collectionId);

        if (existingItem) {
            // Check if adding one more would exceed wallet max
            if (existingItem.quantity >= walletMax) {
                this.showCartFeedback(`Cannot add more ${itemName}! Wallet limit: ${walletMax}`, 'error');
                return;
            }
            existingItem.quantity += 1;
            this.showCartFeedback(`Added ${itemName} to cart! (${existingItem.quantity}/${walletMax})`, 'success');
        } else {
            // Adding new item - always allowed since quantity starts at 1
        this.cart.push({
            id: collection.id,
            title: collection.title,
                price: parseFloat(collection._claimData.priceInWei || collection._claimData.price) / 1e18,
                priceInWei: collection._claimData.priceInWei || collection._claimData.price,
                quantity: 1,
                walletMax: walletMax,
                claimData: collection._claimData // Store full claim data for checkout
            });
            this.showCartFeedback(`Added ${itemName} to cart! (1/${walletMax})`, 'success');
        }

        this.updateCartDisplay();
        this.log(`Added ${itemName} to cart. Current quantity: ${existingItem ? existingItem.quantity : 1}/${walletMax}`);
    }

    removeFromCart(collectionId) {
        this.cart = this.cart.filter(item => item.id !== collectionId);
        this.updateCartDisplay();
        this.log('Removed from cart:', collectionId);
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
        this.log('Cart cleared');
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
            if (cartTotal) cartTotal.textContent = '0 ETH';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        // Render cart items with quantity controls
        cartItems.innerHTML = this.cart.map(item => {
            const walletMax = item.walletMax || 1;
            const isAtMax = item.quantity >= walletMax;
            
            return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-limit">(${item.quantity}/${walletMax})</div>
                </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease" onclick="marketplace.changeQuantity('${item.id}', -1)">-</button>
                        <span class="cart-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" onclick="marketplace.changeQuantity('${item.id}', 1)" ${isAtMax ? 'disabled' : ''}>+</button>
            </div>
                    <div class="cart-item-price">
                        <span>${(item.price * item.quantity).toFixed(4)} ETH</span>
                        <button class="remove-btn" onclick="marketplace.removeFromCart('${item.id}')">REMOVE</button>
                    </div>
                </div>
            `;
        }).join('');

        // Calculate total
        const totalEth = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (cartTotal) cartTotal.textContent = `${totalEth.toFixed(4)} ETH`;
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    changeQuantity(itemId, delta) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);
        if (!item) return;

        const newQuantity = item.quantity + delta;
        const walletMax = item.walletMax || 1;

        if (newQuantity < 1) {
            // Remove item when quantity goes below 1
            this.removeFromCart(itemId);
            this.showCartFeedback(`Removed ${item.title} from cart`);
        } else if (newQuantity > walletMax) {
            this.showCartFeedback(`Cannot add more ${item.title}! Wallet limit: ${walletMax}`, 'error');
        } else {
            item.quantity = newQuantity;
            this.updateCartDisplay();
            this.showCartFeedback(`Updated ${item.title} quantity: ${newQuantity}/${walletMax}`, 'success');
        }
    }

    // ===================
    // MINTING & CHECKOUT
    // ===================
    mintNow(collectionId) {
        this.log('mintNow called for collection:', collectionId);
        
        const collection = this.config.getCollectionById(collectionId);
        this.log('Found collection:', collection);
        
        if (!collection) {
            alert(`Collection with ID "${collectionId}" not found.`);
            this.log('Available collections:', this.config.collections);
            return;
        }

        if (!collection._claimData) {
            alert('Collection is missing claim data.');
            this.log('Collection missing _claimData:', collection);
            return;
        }

        // Add directly to cart instead of opening modal
        this.addToCart(collectionId);
    }

    async checkout() {
        const providerAvailable = await this.isProviderAvailable();
        if (!providerAvailable) {
            this.showCartFeedback('Please install MetaMask or another Web3 wallet', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showCartFeedback('Cart is empty', 'error');
            return;
        }

        try {
            this.log('Starting checkout process...');

            // Step 1: Check and switch network
            this.showCartFeedback('Checking network...', 'success');
            await this.checkAndSwitchNetwork();

            // Step 2: Get user accounts
            const accounts = await this.makeProviderRequest('eth_requestAccounts');
            if (!accounts || accounts.length === 0) {
                throw new Error('No wallet accounts available');
            }

            const userAddress = accounts[0];
            this.log('User address:', userAddress);

            // Step 3: Calculate total cost and show to user
            const totalCost = this.cart.reduce((sum, item) => {
                const tokenCost = item.price * item.quantity;
                const manifoldFee = 0.0005 * item.quantity;
                return sum + tokenCost + manifoldFee;
            }, 0);

            this.showCartFeedback(`Total cost: ${totalCost.toFixed(6)} ETH (includes Manifold fees). Your wallet should show this amount.`, 'success');

            // Process each cart item
            const results = [];
            for (const item of this.cart) {
                if (!item.claimData) {
                    this.log('No claim data for item:', item.id);
                    results.push({
                        item: item.title,
                        success: false,
                        error: 'Missing claim data'
                    });
                    continue;
                }

                try {
                    this.log(`Processing purchase for ${item.title}`);
                    
                    // Execute the purchase transaction using stored claim data
                    const txHash = await this.executePurchase(item.claimData, item.quantity || 1, userAddress);
                    
                    this.showCartFeedback(
                        `Transaction submitted for ${item.title}. Waiting for confirmation...`,
                        'success'
                    );

                    results.push({
                        item: item.title,
                        success: true,
                        txHash: txHash
                    });

                    this.log(`Purchase successful for ${item.title}:`, txHash);

                } catch (error) {
                    this.log(`Purchase failed for ${item.title}:`, error);
                    this.showCartFeedback(`Purchase failed for ${item.title}: ${error.message}`, 'error');
                    
                    results.push({
                        item: item.title,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Show results
            const successful = results.filter(r => r.success).length;
            const total = results.length;
            
            if (successful === total) {
                this.showCartFeedback(`All purchases successful! (${successful}/${total})`, 'success');
            } else if (successful > 0) {
                this.showCartFeedback(`Partial success: ${successful}/${total} purchases completed`, 'warning');
            } else {
                this.showCartFeedback(`All purchases failed (0/${total})`, 'error');
            }

            // Clear cart after processing
            this.clearCart();

            // Check token ownership after successful purchases
            if (successful > 0) {
                setTimeout(() => {
                    this.checkTokenOwnership();
                }, 2000); // Wait 2 seconds for transaction to confirm
            }

        } catch (error) {
            this.log('Checkout failed:', error);
            this.showCartFeedback(`Checkout failed: ${error.message}`, 'error');
        }
    }

    // Modal approach removed - now using direct transactions via checkout

    // ===================
    // MANIFOLD INTEGRATION
    // ===================
    setupManifoldIntegration() {
        this.log('Setting up Manifold integration...');

        // Check if Manifold is properly configured
        if (!this.config.isConfigured()) {
            this.log('Manifold not configured - client ID missing');
            return;
        }

        // Initialize Manifold widgets when available
        const checkManifold = () => {
            if (window.m && window.m.connect) {
                this.log('Manifold connect widgets loaded');
                window.m.connect.initialize();
            }
            
            // Initialize claim widgets using the proper method
            if (window.manifoldWidgets && typeof window.manifoldWidgets.createClaimWidgets === 'function') {
                this.log('Manifold claim widgets loaded');
                window.manifoldWidgets.createClaimWidgets();
            } else if (!window.manifoldWidgets) {
                setTimeout(checkManifold, 100);
            }
        };

        checkManifold();
    }

    // ===================
    // TOKEN OWNERSHIP & COLLECTION PAGE
    // ===================
    async checkTokenOwnership() {
        if (!this.isAuthenticated || !this.connectedWalletAddress) {
            this.userOwnedTokens = [];
            this.updateNavigationVisibility();
            return;
        }

        try {
            this.log('Checking token ownership...');
            
            // Get contract address from the first collection
            const contractAddress = this.getCollectionContractAddress();
            if (!contractAddress) {
                this.log('No contract address found yet');
                return;
            }

            // Use Manifold data client if available
            if (window.manifold && window.manifold.dataClient) {
                const userNFTs = await window.manifold.dataClient.getNFTsOfOwner({
                    filters: [{ contractAddress: contractAddress }]
                });
                
                this.userOwnedTokens = userNFTs || [];
                this.log(`Found ${this.userOwnedTokens.length} owned tokens`);
                this.updateNavigationVisibility();
            }
        } catch (error) {
            this.log('Error checking token ownership:', error);
            this.userOwnedTokens = [];
        }
    }

    getCollectionContractAddress() {
        // Get contract address from the first enabled collection
        const collections = this.config.collections || [];
        for (const collection of collections) {
            if (collection._claimData && collection._claimData.contractAddress) {
                return collection._claimData.contractAddress;
            }
        }
        return null;
    }

    updateNavigationVisibility() {
        const hasTokens = this.userOwnedTokens.length > 0;
        const headerControls = document.querySelector('.header-controls');
        const connectWidget = document.getElementById('connect-widget-container');
        
        // Handle MY COLLECTION button
        const myCollectionButton = document.getElementById('myCollectionButton');
        
        if (hasTokens && !myCollectionButton && this.isAuthenticated) {
            // Add MY COLLECTION button
            const button = document.createElement('button');
            button.id = 'myCollectionButton';
            button.className = 'collection-access-btn';
            button.innerHTML = 'MY COLLECTION';
            button.onclick = () => this.showMyCollection();
            headerControls.insertBefore(button, connectWidget);
        } else if (!hasTokens && myCollectionButton) {
            // Remove MY COLLECTION button if user has no tokens
            myCollectionButton.remove();
        }
    }

    showMyCollection() {
        const hasTokens = this.userOwnedTokens.length > 0;
        if (!hasTokens) {
            this.showCartFeedback('You need to own tokens to access your collection.', 'error');
            return;
        }
        this.showCollectionPage();
    }

    showCollectionPage() {
        this.currentPage = 'collection';
        
        // Hide marketplace
        const marketplace = document.getElementById('mainMarketplace') || document.querySelector('.marketplace-main');
        if (marketplace) marketplace.style.display = 'none';

        // Create or show collection page
        let collectionPage = document.getElementById('collectionPage');
        if (!collectionPage) {
            this.createCollectionPage();
        } else {
            collectionPage.style.display = 'block';
        }

        this.renderTokenGrid();
    }

    createCollectionPage() {
        const collectionHTML = `
            <div id="collectionPage" class="collection-container">
                <button class="collection-back-btn" onclick="marketplace.goBack()">← BACK</button>
                <div class="collection-header">
                    <h1>My Collection</h1>
                    <div class="collection-stats">
                        <span id="tokenCount">${this.userOwnedTokens.length} tokens owned</span>
                    </div>
                </div>
                <div id="tokenGrid" class="token-grid">
                    <!-- Tokens will be loaded here -->
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', collectionHTML);
    }

    renderTokenGrid() {
        const tokenGrid = document.getElementById('tokenGrid');
        const tokenCount = document.getElementById('tokenCount');
        
        if (!tokenGrid) return;

        if (this.userOwnedTokens.length === 0) {
            tokenGrid.innerHTML = `
                <div class="empty-collection-message">
                    <h3>No Tokens Found</h3>
                    <p>You don't own any tokens from this collection yet.</p>
                </div>
            `;
            if (tokenCount) tokenCount.textContent = '0 tokens owned';
            return;
        }

        // Update token count
        if (tokenCount) tokenCount.textContent = `${this.userOwnedTokens.length} tokens owned`;

        // Render token grid
        tokenGrid.innerHTML = this.userOwnedTokens.map((token, index) => this.createTokenGridItem(token, index)).join('');
        
        // Add click handlers to token grid items (alternative approach to onclick in HTML)
        tokenGrid.querySelectorAll('.token-grid-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showTokenModal(this.userOwnedTokens[index]);
            });
        });
    }

    createTokenGridItem(token, index) {
        const tokenImage = token.metadata?.image || token.image || 'https://via.placeholder.com/200x200/667eea/ffffff?text=NFT';
        const tokenName = token.metadata?.name || token.name || `Token #${token.tokenId}`;
        
        return `
            <div class="token-grid-item" data-token-id="${token.tokenId}">
                <img src="${tokenImage}" alt="${tokenName}" class="token-preview-image" 
                     onerror="this.src='https://via.placeholder.com/200x200/667eea/ffffff?text=NFT'">
                <div class="token-info">
                    <div class="token-name">${tokenName}</div>
                    <div class="token-id">Token #${token.tokenId}</div>
                </div>
            </div>
        `;
    }

    showTokenModal(token) {
        this.log('Showing token modal for:', token);
        
        // Hide collection page
        const collectionPage = document.getElementById('collectionPage');
        if (collectionPage) collectionPage.style.display = 'none';
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'tokenModal';
        modal.className = 'token-modal';
        
        const animationUrl = token.metadata?.animation_url || token.animation_url || token.metadata?.animation || token.animation;
        
        this.log('Animation URL:', animationUrl);
        
        if (animationUrl) {
            const iframe = document.createElement('iframe');
            iframe.src = animationUrl;
            iframe.className = 'token-iframe';
            iframe.allow = 'accelerometer; autoplay; camera; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            modal.appendChild(iframe);
        } else {
            // Fallback content with token image
            const content = document.createElement('div');
            content.className = 'token-modal-content';
            const tokenImage = token.metadata?.image || token.image || 'https://via.placeholder.com/400x400/667eea/ffffff?text=NFT';
            const tokenName = token.metadata?.name || token.name || `Token #${token.tokenId}`;
            
            content.innerHTML = `
                <div class="token-modal-image">
                    <img src="${tokenImage}" alt="${tokenName}" onerror="this.src='https://via.placeholder.com/400x400/667eea/ffffff?text=NFT'">
                </div>
                <div class="token-modal-info">
                    <h2>${tokenName}</h2>
                    <p class="token-modal-id">Token #${token.tokenId}</p>
                    <p class="token-modal-description">${token.metadata?.description || 'No description available'}</p>
                </div>
            `;
            modal.appendChild(content);
        }
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'modal-close-btn';
        closeBtn.onclick = () => this.closeTokenModal();
        
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        // Add backdrop click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTokenModal();
            }
        });
    }

    closeTokenModal() {
        const modal = document.getElementById('tokenModal');
        if (modal) {
            modal.remove();
        }
        
        // Show collection page again
        const collectionPage = document.getElementById('collectionPage');
        if (collectionPage) collectionPage.style.display = 'block';
    }

    goBack() {
        // Close any open modal first
        this.closeTokenModal();
        
        this.currentPage = 'marketplace';
        
        // Hide collection page
        const collectionPage = document.getElementById('collectionPage');
        if (collectionPage) collectionPage.style.display = 'none';

        // Show marketplace
        const marketplace = document.getElementById('mainMarketplace') || document.querySelector('.marketplace-main');
        if (marketplace) marketplace.style.display = 'block';
    }

    // ===================
    // UTILITIES
    // ===================
    log(...args) {
        if (this.config.advanced.enableLogging) {
            console.log('[SimpleMarketplace]', ...args);
        }
    }
}

// Initialize marketplace when page loads
let marketplace;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        marketplace = new SimpleMarketplace();
    });
} else {
    marketplace = new SimpleMarketplace();
}
