package com.shopora.shopora.dto;

public class UpdateReviewRequestDTO {

    private Integer rating;
    private String comment;

    public UpdateReviewRequestDTO() {
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}