-- Update the existing database schema
USE shopscape;

-- Add username column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
    CartID INT NOT NULL AUTO_INCREMENT,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (CartID),
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (UserID, ProductID)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    WishlistID INT NOT NULL AUTO_INCREMENT,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (WishlistID),
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (UserID, ProductID)
);

-- Update products table to add image paths
ALTER TABLE products ADD COLUMN IF NOT EXISTS ImagePath VARCHAR(255);

-- Update products with image paths
UPDATE products SET ImagePath = CASE
    WHEN ProductID = 1 THEN './assets/new images/products/jewellery-1.jpg'
    WHEN ProductID = 2 THEN './assets/new images/products/jewellery-2.jpg'
    WHEN ProductID = 3 THEN './assets/new images/products/new products/Pearl.jpg'
    WHEN ProductID = 4 THEN './assets/new images/products/new products/pearlpendant.jpg'
    WHEN ProductID = 5 THEN './assets/new images/products/new products/hoodie.jpg'
    WHEN ProductID = 6 THEN './assets/new images/products/shirt-1.jpg'
    WHEN ProductID = 7 THEN './assets/new images/products/clothes-3.jpg'
    WHEN ProductID = 8 THEN './assets/new images/products/clothes-4.jpg'
    WHEN ProductID = 9 THEN './assets/new images/products/clothes-2.jpg'
    WHEN ProductID = 10 THEN './assets/new images/products/new products/redcroptop.jpg'
    WHEN ProductID = 11 THEN './assets/new images/products/clothes-1.jpg'
    WHEN ProductID = 12 THEN './assets/new images/products/new products/alineminiskirt.jpg'
    WHEN ProductID = 13 THEN './assets/new images/products/jacket-1.jpg'
    WHEN ProductID = 14 THEN './assets/new images/products/jacket-2.jpg'
    WHEN ProductID = 15 THEN './assets/new images/products/sports-1.jpg'
    WHEN ProductID = 16 THEN './assets/new images/products/shoe-1.jpg'
    WHEN ProductID = 17 THEN './assets/new images/products/party-wear-1.jpg'
    WHEN ProductID = 18 THEN './assets/new images/products/sports-2.jpg'
    WHEN ProductID = 19 THEN './assets/new images/products/sports-3.jpg'
    WHEN ProductID = 20 THEN './assets/new images/products/new products/longboots.jpg'
    WHEN ProductID = 21 THEN './assets/new images/products/watch-1.jpg'
    WHEN ProductID = 22 THEN './assets/new images/products/watch-2.jpg'
    WHEN ProductID = 23 THEN './assets/new images/products/perfume.jpg'
    WHEN ProductID = 24 THEN './assets/new images/products/new products/vanilla_bodymist.jpg'
    WHEN ProductID = 25 THEN './assets/new images/products/belt.jpg'
    WHEN ProductID = 26 THEN './assets/new images/products/shampoo.jpg'
    WHEN ProductID = 27 THEN './assets/new images/products/new products/matte_lipstick.jpg'
    WHEN ProductID = 28 THEN './assets/new images/products/new products/beige_compact_powder.jpg'
    WHEN ProductID = 29 THEN './assets/new images/products/new products/bodyscrub.jpg'
    WHEN ProductID = 30 THEN './assets/new images/products/new products/kajal.jpg'
    WHEN ProductID = 31 THEN './assets/new images/products/new products/black_bodycon_dress.jpg'
    WHEN ProductID = 32 THEN './assets/new images/products/new products/vneck_dress.jpg'
    WHEN ProductID = 33 THEN './assets/new images/products/new products/whitelace_dress.jpg'
    WHEN ProductID = 34 THEN './assets/new images/products/new products/floar_party_dress.jpg'
    WHEN ProductID = 35 THEN './assets/new images/products/new products/Cosrx.jpg'
    WHEN ProductID = 36 THEN './assets/new images/products/new products/cetaphil_gentle_cleanser.jpg'
    WHEN ProductID = 37 THEN './assets/new images/products/new products/minimalist_moisturiser.jpg'
    WHEN ProductID = 38 THEN './assets/new images/products/new products/retinol.jpg'
    WHEN ProductID = 39 THEN './assets/new images/products/new products/Serum.jpg'
    WHEN ProductID = 40 THEN './assets/new images/products/new products/red_handbag1.jpg'
    WHEN ProductID = 41 THEN './assets/new images/products/new products/white_tote_bag.jpg'
    WHEN ProductID = 42 THEN './assets/new images/products/new products/cardigan.jpg'
    WHEN ProductID = 43 THEN './assets/new images/products/new products/oversizedsweater.jpg'
    ELSE './assets/images/products/1.jpg'
END;