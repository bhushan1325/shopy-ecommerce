package com.shopora.shopora.dto;

public class CartTotalDTO {

    private Double subtotal;

    public CartTotalDTO() {
    }

    public CartTotalDTO(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }
}