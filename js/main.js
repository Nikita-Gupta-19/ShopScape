// Main JavaScript file for ShopScape e-commerce functionality

class ShopScape {
  constructor() {
    this.currentUser = null;
    this.products = [];
    this.categories = [];
    this.cart = [];
    this.wishlist = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.currentFilters = {};
    
    this.init();
  }

  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.setupEventListeners();
    this.checkAuthStatus();
    this.updateCartCount();
    this.updateWishlistCount();
  }

  // Authentication Methods
  checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.currentUser = JSON.parse(user);
      this.updateAuthUI();
      this.loadUserData();
    }
  }

  async login(formData) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password')
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.currentUser = data.user;
        this.updateAuthUI();
        this.closeModal();
        this.showMessage('Login successful!', 'success');
        await this.loadUserData();
      } else {
        this.showMessage(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage('Login failed. Please try again.', 'error');
    }
  }

  async register(formData) {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
          phonenumber: formData.get('phonenumber'),
          dob: formData.get('dob'),
          address: formData.get('address')
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage('Registration successful! Please login.', 'success');
        this.showLoginForm();
      } else {
        this.showMessage(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage('Registration failed. Please try again.', 'error');
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.currentUser = null;
    this.cart = [];
    this.wishlist = [];
    this.updateAuthUI();
    this.updateCartCount();
    this.updateWishlistCount();
    this.showMessage('Logged out successfully!', 'success');
  }

  updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    
    if (this.currentUser) {
      loginBtn.innerHTML = `
        <div class="user-menu">
          <ion-icon name="person-outline"></ion-icon>
          <div class="user-menu-dropdown">
            <div class="user-menu-item">Welcome, ${this.currentUser.name}</div>
            <div class="user-menu-item" onclick="shopscape.viewOrders()">My Orders</div>
            <div class="user-menu-item" onclick="shopscape.logout()">Logout</div>
          </div>
        </div>
      `;
      
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = loginBtn.querySelector('.user-menu-dropdown');
        dropdown.classList.toggle('active');
      });
    } else {
      loginBtn.innerHTML = '<ion-icon name="person-outline"></ion-icon>';
    }
  }

  // Product Methods
  async loadProducts(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/products?${params}`);
      const products = await response.json();
      
      this.products = products;
      this.renderProducts();
      this.renderBestSellers();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const categories = await response.json();
      
      this.categories = categories;
      this.renderCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  renderProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    if (this.products.length === 0) {
      productGrid.innerHTML = `
        <div class="empty-state">
          <ion-icon name="bag-outline"></ion-icon>
          <p>No products found</p>
        </div>
      `;
      return;
    }

    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.products.slice(0, endIndex);

    productGrid.innerHTML = productsToShow.map(product => `
      <div class="showcase">
        <div class="showcase-banner">
          <img src="${product.ImagePath || './assets/images/products/1.jpg'}" 
               alt="${product.Name}" 
               width="300" 
               class="product-img default">
          <img src="${product.ImagePath || './assets/images/products/1.jpg'}" 
               alt="${product.Name}" 
               width="300" 
               class="product-img hover">
          
          <div class="product-actions">
            <button class="action-btn-small wishlist-btn ${this.isInWishlist(product.ProductID) ? 'active' : ''}" 
                    onclick="shopscape.toggleWishlist(${product.ProductID})">
              <ion-icon name="heart${this.isInWishlist(product.ProductID) ? '' : '-outline'}"></ion-icon>
            </button>
            <button class="action-btn-small" onclick="shopscape.viewProduct(${product.ProductID})">
              <ion-icon name="eye-outline"></ion-icon>
            </button>
          </div>

          <p class="showcase-badge ${product.Stock > 0 ? '' : 'angle'}">${product.Stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
        </div>

        <div class="showcase-content">
          <a href="#" class="showcase-category">${product.categoryName || 'Fashion'}</a>
          <a href="#" onclick="shopscape.viewProduct(${product.ProductID})">
            <h3 class="showcase-title">${product.Name}</h3>
          </a>
          <div class="price-box">
            <p class="price">₹${product.Price}</p>
          </div>
          <button class="add-cart-btn" 
                  onclick="shopscape.addToCart(${product.ProductID})"
                  ${product.Stock <= 0 ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      if (endIndex < this.products.length) {
        loadMoreBtn.style.display = 'block';
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  renderCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    categoryList.innerHTML = this.categories.map(category => `
      <li class="sidebar-menu-category-item">
        <a href="#" class="sidebar-menu-category-link" data-category="${category.Name}">
          ${category.Name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          <span class="category-count">${this.getProductCountByCategory(category.Name)}</span>
        </a>
      </li>
    `).join('');
  }

  renderBestSellers() {
    const bestSellers = document.getElementById('bestSellers');
    if (!bestSellers) return;

    const topProducts = this.products.slice(0, 4);
    
    bestSellers.innerHTML = topProducts.map(product => `
      <div class="showcase">
        <a href="#" onclick="shopscape.viewProduct(${product.ProductID})" class="showcase-img-box">
          <img src="${product.ImagePath || './assets/images/products/1.jpg'}" 
               alt="${product.Name}" 
               width="75" height="75" 
               class="showcase-img">
        </a>
        <div class="showcase-content">
          <a href="#" onclick="shopscape.viewProduct(${product.ProductID})">
            <h4 class="showcase-title">${product.Name}</h4>
          </a>
          <div class="price-box">
            <p class="price">₹${product.Price}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  getProductCountByCategory(categoryName) {
    return this.products.filter(product => product.categoryName === categoryName).length;
  }

  // Cart Methods
  async addToCart(productId, quantity = 1) {
    if (!this.currentUser) {
      this.showLoginModal();
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productId, quantity })
      });

      if (response.ok) {
        this.showMessage('Item added to cart!', 'success');
        await this.loadCart();
      } else {
        const data = await response.json();
        this.showMessage(data.error || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showMessage('Failed to add to cart', 'error');
    }
  }

  async loadCart() {
    if (!this.currentUser) return;

    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        this.cart = await response.json();
        this.updateCartCount();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  async updateCartItem(productId, quantity) {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ quantity })
      });

      if (response.ok) {
        await this.loadCart();
        this.renderCartModal();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  }

  async removeFromCart(productId) {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        await this.loadCart();
        this.renderCartModal();
        this.showMessage('Item removed from cart', 'success');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }

  updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const count = this.cart.reduce((sum, item) => sum + item.Quantity, 0);
    
    if (cartCount) cartCount.textContent = count;
    if (mobileCartCount) mobileCartCount.textContent = count;
  }

  renderCartModal() {
    const cartModalBody = document.getElementById('cartModalBody');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartModalBody) return;

    if (this.cart.length === 0) {
      cartModalBody.innerHTML = `
        <div class="empty-state">
          <ion-icon name="bag-outline"></ion-icon>
          <p>Your cart is empty</p>
        </div>
      `;
      if (cartTotal) cartTotal.textContent = '0';
      return;
    }

    const total = this.cart.reduce((sum, item) => sum + item.Total, 0);
    
    cartModalBody.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.ImagePath || './assets/images/products/1.jpg'}" 
             alt="${item.Name}" 
             class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.Name}</div>
          <div class="cart-item-price">₹${item.Price}</div>
          <div class="cart-item-controls">
            <button class="quantity-btn" onclick="shopscape.updateCartItem(${item.ProductID}, ${item.Quantity - 1})">
              <ion-icon name="remove-outline"></ion-icon>
            </button>
            <span class="quantity-display">${item.Quantity}</span>
            <button class="quantity-btn" onclick="shopscape.updateCartItem(${item.ProductID}, ${item.Quantity + 1})">
              <ion-icon name="add-outline"></ion-icon>
            </button>
            <button class="remove-btn" onclick="shopscape.removeFromCart(${item.ProductID})">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (cartTotal) cartTotal.textContent = total.toFixed(2);
  }

  // Wishlist Methods
  async toggleWishlist(productId) {
    if (!this.currentUser) {
      this.showLoginModal();
      return;
    }

    const isInWishlist = this.isInWishlist(productId);
    
    try {
      if (isInWishlist) {
        await this.removeFromWishlist(productId);
      } else {
        await this.addToWishlist(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  }

  async addToWishlist(productId) {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        this.showMessage('Added to wishlist!', 'success');
        await this.loadWishlist();
        this.renderProducts(); // Re-render to update wishlist buttons
      } else {
        const data = await response.json();
        this.showMessage(data.error || 'Failed to add to wishlist', 'error');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  }

  async removeFromWishlist(productId) {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        this.showMessage('Removed from wishlist', 'success');
        await this.loadWishlist();
        this.renderProducts(); // Re-render to update wishlist buttons
        this.renderWishlistModal();
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }

  async loadWishlist() {
    if (!this.currentUser) return;

    try {
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        this.wishlist = await response.json();
        this.updateWishlistCount();
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  }

  isInWishlist(productId) {
    return this.wishlist.some(item => item.ProductID === productId);
  }

  updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    const mobileWishlistCount = document.getElementById('mobileWishlistCount');
    const count = this.wishlist.length;
    
    if (wishlistCount) wishlistCount.textContent = count;
    if (mobileWishlistCount) mobileWishlistCount.textContent = count;
  }

  renderWishlistModal() {
    const wishlistModalBody = document.getElementById('wishlistModalBody');
    
    if (!wishlistModalBody) return;

    if (this.wishlist.length === 0) {
      wishlistModalBody.innerHTML = `
        <div class="empty-state">
          <ion-icon name="heart-outline"></ion-icon>
          <p>Your wishlist is empty</p>
        </div>
      `;
      return;
    }

    wishlistModalBody.innerHTML = this.wishlist.map(item => `
      <div class="wishlist-item">
        <img src="${item.ImagePath || './assets/images/products/1.jpg'}" 
             alt="${item.Name}" 
             class="wishlist-item-image">
        <div class="wishlist-item-details">
          <div class="wishlist-item-name">${item.Name}</div>
          <div class="wishlist-item-price">₹${item.Price}</div>
          <div class="wishlist-item-actions">
            <button class="add-cart-btn" onclick="shopscape.addToCart(${item.ProductID})">
              Add to Cart
            </button>
            <button class="remove-btn" onclick="shopscape.removeFromWishlist(${item.ProductID})">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Search and Filter Methods
  async searchProducts(query) {
    this.currentFilters.search = query;
    this.currentPage = 1;
    await this.loadProducts(this.currentFilters);
  }

  async filterByCategory(category) {
    this.currentFilters.category = category;
    this.currentPage = 1;
    await this.loadProducts(this.currentFilters);
    
    // Update active category in sidebar
    document.querySelectorAll('.sidebar-menu-category-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
  }

  async applyFilters() {
    const sortBy = document.getElementById('sortSelect')?.value;
    const minPrice = document.getElementById('minPrice')?.value;
    const maxPrice = document.getElementById('maxPrice')?.value;

    if (sortBy) this.currentFilters.sortBy = sortBy;
    if (minPrice) this.currentFilters.minPrice = minPrice;
    if (maxPrice) this.currentFilters.maxPrice = maxPrice;

    this.currentPage = 1;
    await this.loadProducts(this.currentFilters);
  }

  loadMoreProducts() {
    this.currentPage++;
    this.renderProducts();
  }

  // Order Methods
  async checkout() {
    if (!this.currentUser) {
      this.showLoginModal();
      return;
    }

    if (this.cart.length === 0) {
      this.showMessage('Your cart is empty', 'error');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ paymentMethod: 'online' })
      });

      if (response.ok) {
        const data = await response.json();
        this.showMessage('Order placed successfully!', 'success');
        this.cart = [];
        this.updateCartCount();
        this.closeCartModal();
        
        // Redirect to a simple payment page
        window.location.href = `payment.html?orderId=${data.orderId}&amount=${data.totalAmount}`;
      } else {
        const data = await response.json();
        this.showMessage(data.error || 'Failed to place order', 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      this.showMessage('Failed to place order', 'error');
    }
  }

  async viewOrders() {
    // This would typically open an orders page
    window.location.href = 'pages/orders.html';
  }

  // UI Methods
  showLoginModal() {
    const modal = document.querySelector('[data-modal]');
    if (modal) {
      modal.classList.remove('closed');
      modal.classList.add('active');
    }
  }

  closeModal() {
    const modal = document.querySelector('[data-modal]');
    if (modal) {
      modal.classList.add('closed');
      modal.classList.remove('active');
    }
  }

  showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Sign In';
  }

  showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Sign Up';
  }

  showCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      cartModal.classList.add('active');
      this.renderCartModal();
    }
  }

  closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      cartModal.classList.remove('active');
    }
  }

  showWishlistModal() {
    const wishlistModal = document.getElementById('wishlistModal');
    if (wishlistModal) {
      wishlistModal.classList.add('active');
      this.renderWishlistModal();
    }
  }

  closeWishlistModal() {
    const wishlistModal = document.getElementById('wishlistModal');
    if (wishlistModal) {
      wishlistModal.classList.remove('active');
    }
  }

  showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '10000';
    messageEl.style.maxWidth = '300px';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  viewProduct(productId) {
    window.location.href = `pages/product-detail.html?id=${productId}`;
  }

  async loadUserData() {
    await Promise.all([
      this.loadCart(),
      this.loadWishlist()
    ]);
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        this.searchProducts(searchInput.value);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchProducts(searchInput.value);
        }
      });
    }

    // Auth form handling
    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(authForm);
        const isLogin = document.getElementById('loginForm').style.display !== 'none';
        
        if (isLogin) {
          await this.login(formData);
        } else {
          await this.register(formData);
        }
      });
    }

    // Auth form toggles
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    if (showRegister) {
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterForm();
      });
    }
    
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
    }

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (!this.currentUser) {
          this.showLoginModal();
        }
      });
    }

    // Cart and Wishlist buttons
    const cartBtn = document.getElementById('cartBtn');
    const mobileCartBtn = document.getElementById('mobileCartBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');
    const mobileWishlistBtn = document.getElementById('mobileWishlistBtn');

    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.showCartModal());
    }
    if (mobileCartBtn) {
      mobileCartBtn.addEventListener('click', () => this.showCartModal());
    }
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', () => this.showWishlistModal());
    }
    if (mobileWishlistBtn) {
      mobileWishlistBtn.addEventListener('click', () => this.showWishlistModal());
    }

    // Modal close buttons
    const closeCartModal = document.getElementById('closeCartModal');
    const closeWishlistModal = document.getElementById('closeWishlistModal');
    
    if (closeCartModal) {
      closeCartModal.addEventListener('click', () => this.closeCartModal());
    }
    if (closeWishlistModal) {
      closeWishlistModal.addEventListener('click', () => this.closeWishlistModal());
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.checkout());
    }

    // Filter controls
    const sortSelect = document.getElementById('sortSelect');
    const applyFilter = document.getElementById('applyFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.applyFilters());
    }
    if (applyFilter) {
      applyFilter.addEventListener('click', () => this.applyFilters());
    }
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMoreProducts());
    }

    // Category links
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-category')) {
        e.preventDefault();
        const category = e.target.getAttribute('data-category');
        this.filterByCategory(category);
      }
    });

    // Modal overlays
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('cart-modal-overlay')) {
        this.closeCartModal();
      }
      if (e.target.classList.contains('wishlist-modal-overlay')) {
        this.closeWishlistModal();
      }
    });

    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu')) {
        document.querySelectorAll('.user-menu-dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  }
}

// Initialize the application
const shopscape = new ShopScape();

// Make shopscape globally available for onclick handlers
window.shopscape = shopscape;