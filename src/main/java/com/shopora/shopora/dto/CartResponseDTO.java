package com.shopora.shopora.dto;

public class CartResponseDTO {

    private Long id;
    private Long userId;
    private String username;

    public CartResponseDTO(
            Long id,
            Long userId,
            String username) {

        this.id = id;
        this.userId = userId;
        this.username = username;
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
}