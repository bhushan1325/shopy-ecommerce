package com.shopora.shopora.dto;

public class PaymentRequestDTO {

    private Long orderId;
    private String method;

    public PaymentRequestDTO() {
    }

    public PaymentRequestDTO(Long orderId, String method) {
        this.orderId = orderId;
        this.method = method;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }
}