package com.shopora.shopora.controller;

import com.shopora.shopora.dto.OrderResponseDTO;
import com.shopora.shopora.dto.UpdateOrderStatusDTO;
import com.shopora.shopora.model.Order;
import com.shopora.shopora.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderRepository orderRepository;

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "PLACED",
            "CONFIRMED",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
    );

    public AdminOrderController(
            OrderRepository orderRepository) {

        this.orderRepository = orderRepository;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {

        List<Order> orders =
                orderRepository.findAll();

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

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusDTO request) {

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found"
                                ));

        String status = request.getStatus();

        if (status == null ||
                status.trim().isEmpty()) {

            throw new RuntimeException(
                    "Order status is required"
            );
        }

        status = status.trim().toUpperCase();

        if (!ALLOWED_STATUSES.contains(status)) {

            throw new RuntimeException(
                    "Invalid order status. Allowed statuses: "
                            + ALLOWED_STATUSES
            );
        }

        order.setStatus(status);

        Order updatedOrder =
                orderRepository.save(order);

        OrderResponseDTO response =
                new OrderResponseDTO(
                        updatedOrder.getId(),
                        updatedOrder.getUser().getId(),
                        updatedOrder.getUser().getUsername(),
                        updatedOrder.getAddress().getId(),
                        updatedOrder.getAddress().getFullName(),
                        updatedOrder.getAddress().getAddressLine(),
                        updatedOrder.getAddress().getCity(),
                        updatedOrder.getAddress().getState(),
                        updatedOrder.getAddress().getPostalCode(),
                        updatedOrder.getAddress().getCountry(),
                        updatedOrder.getTotalAmount(),
                        updatedOrder.getStatus(),
                        updatedOrder.getOrderDate().toString()
                );

        return ResponseEntity.ok(response);
    }
}