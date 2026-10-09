package com.shopora.shopora.dto;

public class ProductRatingDTO {

    private Long productId;
    private Double averageRating;
    private Long totalReviews;

    public ProductRatingDTO(
            Long productId,
            Double averageRating,
            Long totalReviews) {

        this.productId = productId;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }

    public Long getProductId() {
        return productId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public Long getTotalReviews() {
        return totalReviews;
    }
}