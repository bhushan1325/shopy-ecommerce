package com.shopora.shopora.controller;

import com.shopora.shopora.dto.OrderItemResponseDTO;
import com.shopora.shopora.dto.OrderResponseDTO;
import com.shopora.shopora.model.Order;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;
import com.shopora.shopora.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(
            OrderService orderService,
            UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(
            Authentication authentication) {

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @PostMapping("/create")
    public ResponseEntity<OrderResponseDTO> createOrder(
            @RequestParam Long addressId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        Order order =
                orderService.createOrder(
                        user.getId(),
                        addressId
                );

        OrderResponseDTO response =
                new OrderResponseDTO(
                        order.getId(),
                        order.getUser().getId(),
                        order.getUser().getUsername(),
                        order.getAddress().getId(),
                        order.getAddress().getFullName(),
                        order.getAddress().getAddressLine(),
                        order.getAddress().getCity(),
                        order.getAddress().getState(),
                        order.getAddress().getPostalCode(),
                        order.getAddress().getCountry(),
                        order.getTotalAmount(),
                        order.getStatus(),
                        order.getOrderDate().toString()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user")
    public ResponseEntity<List<OrderResponseDTO>> getUserOrders(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        List<Order> orders =
                orderService.getOrdersByUserId(user.getId());

        List<OrderResponseDTO> response =
                orders.stream()
                        .map(order -> new OrderResponseDTO(
                                order.getId(),
                                order.getUser().getId(),
                                order.getUser().getUsername(),
                                order.getAddress().getId(),
                                order.getAddress().getFullName(),
                                order.getAddress().getAddressLine(),
                                order.getAddress().getCity(),
                                order.getAddress().getState(),
                                order.getAddress().getPostalCode(),
                                order.getAddress().getCountry(),
                                order.getTotalAmount(),
                                order.getStatus(),
                                order.getOrderDate().toString()
                        ))
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}/items")
    public ResponseEntity<List<OrderItemResponseDTO>> getOrderItems(
            @PathVariable Long orderId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        List<Order> userOrders =
                orderService.getOrdersByUserId(user.getId());

        boolean ownsOrder =
                userOrders.stream()
                        .anyMatch(order ->
                                order.getId().equals(orderId));

        if (!ownsOrder) {
            return ResponseEntity.notFound().build();
        }

        List<OrderItemResponseDTO> items =
                orderService.getOrderItems(orderId);

        return ResponseEntity.ok(items);
    }
}