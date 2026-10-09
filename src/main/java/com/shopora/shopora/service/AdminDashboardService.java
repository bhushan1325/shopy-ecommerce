package com.shopora.shopora.service;

import com.shopora.shopora.dto.AdminDashboardDTO;
import com.shopora.shopora.repository.OrderRepository;
import com.shopora.shopora.repository.ProductRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository) {

        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    public AdminDashboardDTO getDashboard() {

        long totalUsers =
                userRepository.count();

        long totalProducts =
                productRepository.count();

        long totalOrders =
                orderRepository.count();

        double totalRevenue =
                orderRepository.findAll()
                        .stream()
                        .mapToDouble(order ->
                                order.getTotalAmount())
                        .sum();

        return new AdminDashboardDTO(
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue
        );
    }
}