package com.shopora.shopora.service;

import com.shopora.shopora.dto.OrderItemResponseDTO;
import com.shopora.shopora.model.Address;
import com.shopora.shopora.model.Cart;
import com.shopora.shopora.model.CartItem;
import com.shopora.shopora.model.Order;
import com.shopora.shopora.model.OrderItem;
import com.shopora.shopora.model.Product;
import com.shopora.shopora.model.ProductVariant;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.AddressRepository;
import com.shopora.shopora.repository.CartItemRepository;
import com.shopora.shopora.repository.CartRepository;
import com.shopora.shopora.repository.OrderItemRepository;
import com.shopora.shopora.repository.OrderRepository;
import com.shopora.shopora.repository.ProductRepository;
import com.shopora.shopora.repository.ProductVariantRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            AddressRepository addressRepository,
            ProductRepository productRepository,
            ProductVariantRepository productVariantRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public Order createOrder(Long userId, Long addressId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() ->
                        new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException(
                    "Address does not belong to this user"
            );
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        List<CartItem> cartItems =
                cartItemRepository.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new RuntimeException(
                    "Cannot create order from empty cart"
            );
        }

        double totalAmount = 0.0;

        for (CartItem cartItem : cartItems) {

            Product product = cartItem.getProduct();
            ProductVariant variant = cartItem.getVariant();

            int quantity = cartItem.getQuantity();

            if (product.getStock() < quantity) {
                throw new RuntimeException(
                        "Not enough product stock for: "
                                + product.getName()
                );
            }

            if (variant != null &&
                    variant.getStock() < quantity) {

                throw new RuntimeException(
                        "Not enough variant stock for: "
                                + variant.getValue()
                );
            }

            double productPrice =
                    product.getPrice();

            double additionalPrice = 0.0;

            if (variant != null &&
                    variant.getAdditionalPrice() != null) {

                additionalPrice =
                        variant.getAdditionalPrice();
            }

            double finalPrice =
                    productPrice + additionalPrice;

            totalAmount +=
                    finalPrice * quantity;
        }

        Order order = new Order(
                user,
                address,
                totalAmount,
                "PLACED",
                LocalDateTime.now()
        );

        Order savedOrder =
                orderRepository.save(order);

        for (CartItem cartItem : cartItems) {

            Product product =
                    cartItem.getProduct();

            ProductVariant variant =
                    cartItem.getVariant();

            int quantity =
                    cartItem.getQuantity();

            product.setStock(
                    product.getStock() - quantity
            );

            productRepository.save(product);

            if (variant != null) {

                variant.setStock(
                        variant.getStock() - quantity
                );

                productVariantRepository.save(variant);
            }

            double productPrice =
                    product.getPrice();

            double additionalPrice = 0.0;

            if (variant != null &&
                    variant.getAdditionalPrice() != null) {

                additionalPrice =
                        variant.getAdditionalPrice();
            }

            double finalPrice =
                    productPrice + additionalPrice;

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    product,
                    variant,
                    quantity,
                    finalPrice
            );

            orderItemRepository.save(orderItem);
        }

        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }

    public List<Order> getOrdersByUserId(Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return orderRepository.findByUserId(userId);
    }

    /*
     * Get all items belonging to one order
     */
    public List<OrderItemResponseDTO> getOrderItems(Long orderId) {

        orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found"));

        List<OrderItem> orderItems =
                orderItemRepository.findByOrderId(orderId);

        return orderItems.stream()
                .map(item -> {

                    Product product =
                            item.getProduct();

                    ProductVariant variant =
                            item.getVariant();

                    Long variantId = null;
                    String variantValue = null;

                    if (variant != null) {
                        variantId = variant.getId();
                        variantValue = variant.getValue();
                    }

                    return new OrderItemResponseDTO(
                            item.getId(),
                            item.getOrder().getId(),
                            product.getId(),
                            product.getName(),
                            variantId,
                            variantValue,
                            item.getQuantity(),
                            item.getPrice()
                    );
                })
                .collect(Collectors.toList());
    }
}