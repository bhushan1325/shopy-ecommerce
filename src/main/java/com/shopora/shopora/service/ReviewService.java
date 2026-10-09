package com.shopora.shopora.service;

import com.shopora.shopora.dto.ProductRatingDTO;
import com.shopora.shopora.dto.ReviewRequestDTO;
import com.shopora.shopora.dto.ReviewResponseDTO;
import com.shopora.shopora.dto.UpdateReviewRequestDTO;
import com.shopora.shopora.model.Product;
import com.shopora.shopora.model.Review;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.ProductRepository;
import com.shopora.shopora.repository.ReviewRepository;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {

        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public ReviewResponseDTO addReview(ReviewRequestDTO request) {

        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (request.getProductId() == null) {
            throw new RuntimeException("Product ID is required");
        }

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }

        if (request.getComment() == null ||
                request.getComment().trim().isEmpty()) {

            throw new RuntimeException(
                    "Review comment is required"
            );
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        if (reviewRepository
                .findByUserIdAndProductId(
                        request.getUserId(),
                        request.getProductId())
                .isPresent()) {

            throw new RuntimeException(
                    "You have already reviewed this product"
            );
        }

        Review review = new Review(
                user,
                product,
                request.getRating(),
                request.getComment().trim(),
                LocalDateTime.now()
        );

        Review savedReview = reviewRepository.save(review);

        return convertToDTO(savedReview);
    }

    public List<ReviewResponseDTO> getReviewsByProductId(
            Long productId) {

        return reviewRepository
                .findByProductIdOrderByReviewDateDesc(productId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProductRatingDTO getProductRating(Long productId) {

        List<Review> reviews =
                reviewRepository.findByProductId(productId);

        if (reviews.isEmpty()) {
            return new ProductRatingDTO(
                    productId,
                    0.0,
                    0L
            );
        }

        double averageRating =
                reviews.stream()
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0.0);

        double roundedRating =
                Math.round(averageRating * 10.0) / 10.0;

        return new ProductRatingDTO(
                productId,
                roundedRating,
                (long) reviews.size()
        );
    }

    public ReviewResponseDTO updateReview(
            Long reviewId,
            Long userId,
            UpdateReviewRequestDTO request) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException(
                    "You cannot edit this review"
            );
        }

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }

        if (request.getComment() == null ||
                request.getComment().trim().isEmpty()) {

            throw new RuntimeException(
                    "Review comment is required"
            );
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());

        Review updatedReview =
                reviewRepository.save(review);

        return convertToDTO(updatedReview);
    }

    public void deleteReview(
            Long reviewId,
            Long userId) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException(
                    "You cannot delete this review"
            );
        }

        reviewRepository.delete(review);
    }

    private ReviewResponseDTO convertToDTO(
            Review review) {

        return new ReviewResponseDTO(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getUsername(),
                review.getProduct().getId(),
                review.getProduct().getName(),
                review.getRating(),
                review.getComment(),
                review.getReviewDate().toString()
        );
    }
}