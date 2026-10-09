package com.shopora.shopora.service;

import com.shopora.shopora.dto.AddToCartRequestDTO;
import com.shopora.shopora.dto.CartTotalDTO;
import com.shopora.shopora.model.Cart;
import com.shopora.shopora.model.CartItem;
import com.shopora.shopora.model.Product;
import com.shopora.shopora.model.ProductVariant;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.CartItemRepository;
import com.shopora.shopora.repository.CartRepository;
import com.shopora.shopora.repository.ProductRepository;
import com.shopora.shopora.repository.ProductVariantRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            UserRepository userRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
    }

    public Cart getOrCreateCart(User user) {

        return cartRepository
                .findByUserId(user.getId())
                .orElseGet(() -> {

                    Cart cart = new Cart(user);

                    return cartRepository.save(cart);
                });
    }

    public List<CartItem> getCartItems(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Cart cart = getOrCreateCart(user);

        return cartItemRepository.findByCartId(
                cart.getId()
        );
    }

    public CartItem addToCart(
            AddToCartRequestDTO request,
            User user) {

        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found"
                        ));

        Cart cart = getOrCreateCart(user);

        ProductVariant variant = null;

        if (request.getVariantId() != null) {

            variant = variantRepository
                    .findById(request.getVariantId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Product variant not found"
                            ));

            if (!variant.getProduct().getId()
                    .equals(product.getId())) {

                throw new RuntimeException(
                        "Variant does not belong to this product"
                );
            }
        }

        if (request.getQuantity() == null ||
                request.getQuantity() <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }

        int availableStock;

        if (variant != null) {
            availableStock = variant.getStock();
        } else {
            availableStock = product.getStock();
        }

        if (request.getQuantity() > availableStock) {

            throw new RuntimeException(
                    "Not enough stock available"
            );
        }

        CartItem existingItem = null;

        if (variant != null) {

            existingItem =
                    cartItemRepository
                            .findByCartIdAndProductIdAndVariantId(
                                    cart.getId(),
                                    product.getId(),
                                    variant.getId()
                            )
                            .orElse(null);

        } else {

            existingItem =
                    cartItemRepository
                            .findByCartIdAndProductId(
                                    cart.getId(),
                                    product.getId()
                            )
                            .orElse(null);
        }

        if (existingItem != null) {

            int newQuantity =
                    existingItem.getQuantity()
                            + request.getQuantity();

            if (newQuantity > availableStock) {

                throw new RuntimeException(
                        "Not enough stock available"
                );
            }

            existingItem.setQuantity(newQuantity);

            return cartItemRepository.save(
                    existingItem
            );
        }

        CartItem cartItem =
                new CartItem(
                        cart,
                        product,
                        variant,
                        request.getQuantity()
                );

        return cartItemRepository.save(cartItem);
    }

    public CartItem updateCartItemQuantity(
            Long cartItemId,
            Integer quantity,
            User user) {

        if (quantity == null || quantity <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }

        CartItem cartItem =
                cartItemRepository.findById(cartItemId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cart item not found"
                                ));

        if (!cartItem.getCart()
                .getUser()
                .getId()
                .equals(user.getId())) {

            throw new RuntimeException(
                    "You are not allowed to modify this cart item"
            );
        }

        int availableStock;

        if (cartItem.getVariant() != null) {

            availableStock =
                    cartItem.getVariant().getStock();

        } else {

            availableStock =
                    cartItem.getProduct().getStock();
        }

        if (quantity > availableStock) {

            throw new RuntimeException(
                    "Not enough stock available"
            );
        }

        cartItem.setQuantity(quantity);

        return cartItemRepository.save(cartItem);
    }

    public void removeCartItem(
            Long cartItemId,
            User user) {

        CartItem cartItem =
                cartItemRepository.findById(cartItemId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cart item not found"
                                ));

        if (!cartItem.getCart()
                .getUser()
                .getId()
                .equals(user.getId())) {

            throw new RuntimeException(
                    "You are not allowed to remove this cart item"
            );
        }

        cartItemRepository.delete(cartItem);
    }

    public CartTotalDTO calculateCartTotal(
            Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        ));

        Cart cart = getOrCreateCart(user);

        List<CartItem> cartItems =
                cartItemRepository.findByCartId(
                        cart.getId()
                );

        double subtotal = 0.0;

        for (CartItem cartItem : cartItems) {

            double productPrice =
                    cartItem.getProduct().getPrice();

            double additionalPrice = 0.0;

            if (cartItem.getVariant() != null &&
                    cartItem.getVariant()
                            .getAdditionalPrice() != null) {

                additionalPrice =
                        cartItem.getVariant()
                                .getAdditionalPrice();
            }

            double finalItemPrice =
                    productPrice + additionalPrice;

            subtotal +=
                    finalItemPrice
                            * cartItem.getQuantity();
        }

        return new CartTotalDTO(subtotal);
    }
}