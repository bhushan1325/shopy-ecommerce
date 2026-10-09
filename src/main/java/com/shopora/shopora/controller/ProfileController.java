package com.shopora.shopora.controller;

import com.shopora.shopora.dto.UserProfileDTO;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/profile")
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(
            UserRepository userRepository) {

        this.userRepository =
                userRepository;
    }


    // =====================================
    // GET PROFILE
    // =====================================

    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(
            Authentication authentication) {

        String username =
                authentication.getName();


        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );


        UserProfileDTO profile =
                new UserProfileDTO(
                        user.getId(),
                        user.getName(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole()
                );


        return ResponseEntity.ok(
                profile
        );
    }


    // =====================================
    // UPDATE PROFILE
    // =====================================

    @PutMapping
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestBody UserProfileDTO request,
            Authentication authentication) {

        String username =
                authentication.getName();


        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );


        // -------------------------------
        // Validate name
        // -------------------------------

        if (
                request.getName() == null ||
                request.getName()
                        .trim()
                        .isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }


        // -------------------------------
        // Validate email
        // -------------------------------

        if (
                request.getEmail() == null ||
                request.getEmail()
                        .trim()
                        .isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }


        // -------------------------------
        // Check duplicate email
        // -------------------------------

        var existingUser =
                userRepository
                        .findByEmail(
                                request.getEmail()
                                        .trim()
                        );


        if (
                existingUser.isPresent() &&
                !existingUser
                        .get()
                        .getId()
                        .equals(user.getId())
        ) {

            return ResponseEntity
                    .status(409)
                    .build();
        }


        // -------------------------------
        // Update allowed fields
        // -------------------------------

        user.setName(
                request.getName().trim()
        );

        user.setEmail(
                request.getEmail().trim()
        );


        /*
         * Username is intentionally NOT changed.
         *
         * Password is intentionally NOT returned
         * or modified by this endpoint.
         *
         * Role is also not changed by the customer.
         */


        User updatedUser =
                userRepository.save(user);


        UserProfileDTO profile =
                new UserProfileDTO(
                        updatedUser.getId(),
                        updatedUser.getName(),
                        updatedUser.getUsername(),
                        updatedUser.getEmail(),
                        updatedUser.getRole()
                );


        return ResponseEntity.ok(
                profile
        );
    }
}