package com.shopora.shopora.service;

import com.shopora.shopora.dto.PaymentRequestDTO;
import com.shopora.shopora.dto.PaymentResponseDTO;
import com.shopora.shopora.model.Order;
import com.shopora.shopora.model.Payment;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.OrderRepository;
import com.shopora.shopora.repository.PaymentRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            UserRepository userRepository) {

        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public PaymentResponseDTO makePayment(
            PaymentRequestDTO request,
            String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Order order = orderRepository.findById(
                request.getOrderId()
        ).orElseThrow(() ->
                new RuntimeException("Order not found"));

        // Make sure the order belongs to the logged-in user
        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to pay for this order"
            );
        }

        /*
         * Check whether payment already exists.
         *
         * If it already exists, return the existing payment
         * instead of throwing an error.
         */
        var existingPayment =
                paymentRepository.findByOrderId(
                        request.getOrderId()
                );

        if (existingPayment.isPresent()) {

            Payment payment = existingPayment.get();

            // Make sure the order remains confirmed
            if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                order.setStatus("CONFIRMED");
                orderRepository.save(order);
            }

            return new PaymentResponseDTO(
                    payment.getId(),
                    payment.getOrder().getId(),
                    payment.getAmount(),
                    payment.getMethod(),
                    payment.getStatus(),
                    payment.getTransactionId(),
                    payment.getPaymentDate().toString()
            );
        }

        // =========================================
        // CREATE NEW PAYMENT
        // =========================================

        String transactionId =
                "TXN-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();

        Payment payment = new Payment(
                order,
                order.getTotalAmount(),
                request.getMethod(),
                "SUCCESS",
                transactionId,
                LocalDateTime.now()
        );

        Payment savedPayment =
                paymentRepository.save(payment);

        // Payment successful → confirm order
        order.setStatus("CONFIRMED");
        orderRepository.save(order);

        return new PaymentResponseDTO(
                savedPayment.getId(),
                order.getId(),
                savedPayment.getAmount(),
                savedPayment.getMethod(),
                savedPayment.getStatus(),
                savedPayment.getTransactionId(),
                savedPayment.getPaymentDate().toString()
        );
    }


    public PaymentResponseDTO getPaymentByOrderId(
            Long orderId,
            String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found"));

        // Make sure the order belongs to the logged-in user
        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to view this payment"
            );
        }

        Payment payment = paymentRepository
                .findByOrderId(orderId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Payment not found for this order"
                        ));

        return new PaymentResponseDTO(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getTransactionId(),
                payment.getPaymentDate().toString()
        );
    }
}