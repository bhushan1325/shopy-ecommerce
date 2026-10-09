package com.shopora.shopora.dto;

public class CartItemResponseDTO {

    private Long id;
    private Long productId;
    private String productName;
    private Double price;
    private Integer quantity;
    private Long variantId;

    public CartItemResponseDTO(
            Long id,
            Long productId,
            String productName,
            Double price,
            Integer quantity,
            Long variantId) {

        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.quantity = quantity;
        this.variantId = variantId;
    }

    public Long getId() {
        return id;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Double getPrice() {
        return price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public Long getVariantId() {
        return variantId;
    }
}