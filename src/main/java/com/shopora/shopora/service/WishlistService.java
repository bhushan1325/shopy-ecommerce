package com.shopora.shopora.service;

import com.shopora.shopora.exception.WishlistException;
import com.shopora.shopora.model.Product;
import com.shopora.shopora.model.User;
import com.shopora.shopora.model.Wishlist;
import com.shopora.shopora.model.WishlistItem;
import com.shopora.shopora.repository.ProductRepository;
import com.shopora.shopora.repository.UserRepository;
import com.shopora.shopora.repository.WishlistItemRepository;
import com.shopora.shopora.repository.WishlistRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(
            WishlistRepository wishlistRepository,
            WishlistItemRepository wishlistItemRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {

        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public Wishlist getOrCreateWishlist(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return wishlistRepository.findByUserId(userId)
                .orElseGet(() ->
                        wishlistRepository.save(
                                new Wishlist(user)
                        )
                );
    }

    public WishlistItem addToWishlist(
            Long userId,
            Long productId) {

        Wishlist wishlist =
                getOrCreateWishlist(userId);

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product not found"
                                ));

        if (wishlistItemRepository
                .findByWishlistIdAndProductId(
                        wishlist.getId(),
                        productId
                ).isPresent()) {

            throw new WishlistException(
                    "Product already exists in wishlist"
            );
        }

        WishlistItem wishlistItem =
                new WishlistItem(
                        wishlist,
                        product
                );

        return wishlistItemRepository.save(
                wishlistItem
        );
    }

    public List<WishlistItem> getWishlistItems(
            Long userId) {

        Wishlist wishlist =
                getOrCreateWishlist(userId);

        return wishlistItemRepository
                .findByWishlistId(wishlist.getId());
    }

    public void removeFromWishlist(
            Long userId,
            Long productId) {

        Wishlist wishlist =
                getOrCreateWishlist(userId);

        WishlistItem wishlistItem =
                wishlistItemRepository
                        .findByWishlistIdAndProductId(
                                wishlist.getId(),
                                productId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product not found in wishlist"
                                ));

        wishlistItemRepository.delete(
                wishlistItem
        );
    }
}