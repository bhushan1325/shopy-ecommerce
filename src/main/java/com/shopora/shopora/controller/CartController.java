package com.shopora.shopora.controller;

import com.shopora.shopora.dto.AddToCartRequestDTO;
import com.shopora.shopora.dto.CartItemResponseDTO;
import com.shopora.shopora.dto.CartResponseDTO;
import com.shopora.shopora.dto.CartTotalDTO;
import com.shopora.shopora.dto.UpdateCartItemDTO;
import com.shopora.shopora.model.Cart;
import com.shopora.shopora.model.CartItem;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;
import com.shopora.shopora.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(
            CartService cartService,
            UserRepository userRepository) {

        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(
            Authentication authentication) {

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<CartResponseDTO> getCart(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        Cart cart = cartService.getOrCreateCart(user);

        CartResponseDTO response =
                new CartResponseDTO(
                        cart.getId(),
                        user.getId(),
                        user.getUsername()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/items")
    public ResponseEntity<List<CartItemResponseDTO>> getCartItems(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        List<CartItem> cartItems =
                cartService.getCartItems(user.getId());

        List<CartItemResponseDTO> response =
                cartItems.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<CartItemResponseDTO> addToCart(
            @RequestBody AddToCartRequestDTO request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        CartItem cartItem =
                cartService.addToCart(request, user);

        return ResponseEntity.ok(
                convertToDTO(cartItem)
        );
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemResponseDTO> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestBody UpdateCartItemDTO request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        CartItem updatedItem =
                cartService.updateCartItemQuantity(
                        cartItemId,
                        request.getQuantity(),
                        user
                );

        return ResponseEntity.ok(
                convertToDTO(updatedItem)
        );
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable Long cartItemId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        cartService.removeCartItem(
                cartItemId,
                user
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total")
    public ResponseEntity<CartTotalDTO> getCartTotal(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        CartTotalDTO cartTotal =
                cartService.calculateCartTotal(user.getId());

        return ResponseEntity.ok(cartTotal);
    }

    private CartItemResponseDTO convertToDTO(
            CartItem cartItem) {

        Long variantId = null;

        if (cartItem.getVariant() != null) {
            variantId =
                    cartItem.getVariant().getId();
        }

        double productPrice =
                cartItem.getProduct().getPrice();

        double additionalPrice = 0.0;

        if (cartItem.getVariant() != null &&
                cartItem.getVariant().getAdditionalPrice() != null) {

            additionalPrice =
                    cartItem.getVariant().getAdditionalPrice();
        }

        double finalPrice =
                productPrice + additionalPrice;

        return new CartItemResponseDTO(
                cartItem.getId(),
                cartItem.getProduct().getId(),
                cartItem.getProduct().getName(),
                finalPrice,
                cartItem.getQuantity(),
                variantId
        );
    }
}