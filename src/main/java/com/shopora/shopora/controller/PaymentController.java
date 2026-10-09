package com.shopora.shopora.controller;

import com.shopora.shopora.dto.PaymentRequestDTO;
import com.shopora.shopora.dto.PaymentResponseDTO;
import com.shopora.shopora.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDTO> makePayment(
            @RequestBody PaymentRequestDTO request,
            Authentication authentication) {

        PaymentResponseDTO response =
                paymentService.makePayment(
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponseDTO> getPaymentByOrderId(
            @PathVariable Long orderId,
            Authentication authentication) {

        PaymentResponseDTO response =
                paymentService.getPaymentByOrderId(
                        orderId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }
}