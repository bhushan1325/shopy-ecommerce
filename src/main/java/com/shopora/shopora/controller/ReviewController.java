package com.shopora.shopora.controller;

import com.shopora.shopora.dto.ProductRatingDTO;
import com.shopora.shopora.dto.ReviewRequestDTO;
import com.shopora.shopora.dto.ReviewResponseDTO;
import com.shopora.shopora.dto.UpdateReviewRequestDTO;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;
import com.shopora.shopora.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    public ReviewController(
            ReviewService reviewService,
            UserRepository userRepository) {
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(
            Authentication authentication) {

        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @PostMapping
    public ResponseEntity<ReviewResponseDTO> addReview(
            @RequestBody ReviewRequestDTO request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        request.setUserId(user.getId());

        ReviewResponseDTO response =
                reviewService.addReview(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponseDTO>> getReviewsByProduct(
            @PathVariable Long productId) {

        List<ReviewResponseDTO> reviews =
                reviewService.getReviewsByProductId(productId);

        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productId}/rating")
    public ResponseEntity<ProductRatingDTO> getProductRating(
            @PathVariable Long productId) {

        ProductRatingDTO rating =
                reviewService.getProductRating(productId);

        return ResponseEntity.ok(rating);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDTO> updateReview(
            @PathVariable Long reviewId,
            @RequestBody UpdateReviewRequestDTO request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        ReviewResponseDTO response =
                reviewService.updateReview(
                        reviewId,
                        user.getId(),
                        request
                );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        reviewService.deleteReview(
                reviewId,
                user.getId()
        );

        return ResponseEntity.noContent().build();
    }
}