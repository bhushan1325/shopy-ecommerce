package com.shopora.shopora.dto;

public class OrderResponseDTO {

    private Long id;
    private Long userId;
    private String username;

    private Long addressId;
    private String fullName;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private String country;

    private Double totalAmount;
    private String status;
    private String orderDate;

    public OrderResponseDTO(
            Long id,
            Long userId,
            String username,
            Long addressId,
            String fullName,
            String addressLine,
            String city,
            String state,
            String postalCode,
            String country,
            Double totalAmount,
            String status,
            String orderDate) {

        this.id = id;
        this.userId = userId;
        this.username = username;
        this.addressId = addressId;
        this.fullName = fullName;
        this.addressLine = addressLine;
        this.city = city;
        this.state = state;
        this.postalCode = postalCode;
        this.country = country;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderDate = orderDate;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public Long getAddressId() {
        return addressId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getCountry() {
        return country;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public String getOrderDate() {
        return orderDate;
    }
}