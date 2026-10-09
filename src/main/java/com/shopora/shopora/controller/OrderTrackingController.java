package com.shopora.shopora.controller;

import com.shopora.shopora.dto.OrderTrackingDTO;
import com.shopora.shopora.model.Order;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.OrderRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderTrackingController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderTrackingController(
            OrderRepository orderRepository,
            UserRepository userRepository) {

        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/{orderId}/tracking")
    public ResponseEntity<OrderTrackingDTO> getOrderTracking(
            @PathVariable Long orderId,
            Authentication authentication) {

        String username = authentication.getName();

        User user =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found"
                                ));

        if (!order.getUser().getId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }

        String message;

        switch (order.getStatus()) {
            case "PLACED":
                message = "Your order has been placed.";
                break;

            case "CONFIRMED":
                message = "Your order has been confirmed.";
                break;

            case "SHIPPED":
                message = "Your order has been shipped.";
                break;

            case "OUT_FOR_DELIVERY":
                message = "Your order is out for delivery.";
                break;

            case "DELIVERED":
                message = "Your order has been delivered.";
                break;

            default:
                message = "Your order status is " +
                        order.getStatus();
        }

        OrderTrackingDTO response =
                new OrderTrackingDTO(
                        order.getId(),
                        order.getStatus(),
                        message
                );

        return ResponseEntity.ok(response);
    }
}