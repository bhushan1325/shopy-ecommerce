package com.shopora.shopora.dto;

public class OrderItemResponseDTO {

    private Long id;
    private Long orderId;

    private Long productId;
    private String productName;

    private Long variantId;
    private String variantValue;

    private Integer quantity;
    private Double price;

    public OrderItemResponseDTO(
            Long id,
            Long orderId,
            Long productId,
            String productName,
            Long variantId,
            String variantValue,
            Integer quantity,
            Double price) {

        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.variantId = variantId;
        this.variantValue = variantValue;
        this.quantity = quantity;
        this.price = price;
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Long getVariantId() {
        return variantId;
    }

    public String getVariantValue() {
        return variantValue;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public Double getPrice() {
        return price;
    }
}