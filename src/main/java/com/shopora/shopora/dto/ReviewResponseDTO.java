package com.shopora.shopora.dto;

public class ReviewResponseDTO {

    private Long id;
    private Long userId;
    private String username;

    private Long productId;
    private String productName;

    private Integer rating;
    private String comment;
    private String reviewDate;

    public ReviewResponseDTO(
            Long id,
            Long userId,
            String username,
            Long productId,
            String productName,
            Integer rating,
            String comment,
            String reviewDate) {

        this.id = id;
        this.userId = userId;
        this.username = username;
        this.productId = productId;
        this.productName = productName;
        this.rating = rating;
        this.comment = comment;
        this.reviewDate = reviewDate;
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

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public String getReviewDate() {
        return reviewDate;
    }
}