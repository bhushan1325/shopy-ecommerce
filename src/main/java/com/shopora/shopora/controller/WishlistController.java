package com.shopora.shopora.controller;

import com.shopora.shopora.model.User;
import com.shopora.shopora.model.WishlistItem;
import com.shopora.shopora.repository.UserRepository;
import com.shopora.shopora.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserRepository userRepository;

    public WishlistController(
            WishlistService wishlistService,
            UserRepository userRepository) {
        this.wishlistService = wishlistService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(
            Authentication authentication) {

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @PostMapping("/add")
    public ResponseEntity<WishlistItem> addToWishlist(
            @RequestParam Long productId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        WishlistItem wishlistItem =
                wishlistService.addToWishlist(
                        user.getId(),
                        productId
                );

        return ResponseEntity.ok(wishlistItem);
    }

    @GetMapping
    public ResponseEntity<List<WishlistItem>> getWishlist(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        List<WishlistItem> items =
                wishlistService.getWishlistItems(
                        user.getId()
                );

        return ResponseEntity.ok(items);
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeFromWishlist(
            @RequestParam Long productId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        wishlistService.removeFromWishlist(
                user.getId(),
                productId
        );

        return ResponseEntity.noContent().build();
    }
}