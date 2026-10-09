package com.shopora.shopora.dto;

public class PaymentResponseDTO {

    private Long id;
    private Long orderId;
    private Double amount;
    private String method;
    private String status;
    private String transactionId;
    private String paymentDate;

    public PaymentResponseDTO(
            Long id,
            Long orderId,
            Double amount,
            String method,
            String status,
            String transactionId,
            String paymentDate) {

        this.id = id;
        this.orderId = orderId;
        this.amount = amount;
        this.method = method;
        this.status = status;
        this.transactionId = transactionId;
        this.paymentDate = paymentDate;
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Double getAmount() {
        return amount;
    }

    public String getMethod() {
        return method;
    }

    public String getStatus() {
        return status;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getPaymentDate() {
        return paymentDate;
    }
}