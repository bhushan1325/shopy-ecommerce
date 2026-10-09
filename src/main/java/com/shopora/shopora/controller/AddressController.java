package com.shopora.shopora.controller;

import com.shopora.shopora.dto.AddressResponseDTO;
import com.shopora.shopora.model.Address;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.AddressRepository;
import com.shopora.shopora.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressController(
            AddressRepository addressRepository,
            UserRepository userRepository) {

        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // SAVE ADDRESS
    // ==========================================

    @PostMapping
    public ResponseEntity<?> createAddress(
            @RequestBody Address address,
            Authentication authentication) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Please login first.");
            }

            String username = authentication.getName();

            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User not found.");
            }

            Address newAddress = new Address(
                    address.getFullName(),
                    address.getPhone(),
                    address.getAddressLine(),
                    address.getCity(),
                    address.getState(),
                    address.getPostalCode(),
                    address.getCountry(),
                    user
            );

            Address savedAddress =
                    addressRepository.save(newAddress);

            return ResponseEntity.ok(
                    convertToDTO(savedAddress)
            );

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to save address.");
        }
    }

    // ==========================================
    // GET MY ADDRESSES
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getMyAddresses(
            Authentication authentication) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Please login first.");
            }

            String username = authentication.getName();

            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User not found.");
            }

            List<AddressResponseDTO> addresses =
                    addressRepository
                            .findByUserId(user.getId())
                            .stream()
                            .map(this::convertToDTO)
                            .collect(Collectors.toList());

            return ResponseEntity.ok(addresses);

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to load addresses.");
        }
    }

    // ==========================================
    // GET ADDRESS BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getAddressById(
            @PathVariable Long id,
            Authentication authentication) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Please login first.");
            }

            String username = authentication.getName();

            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User not found.");
            }

            Address address =
                    addressRepository.findById(id).orElse(null);

            if (address == null) {

                return ResponseEntity.notFound().build();
            }

            if (!address.getUser().getId().equals(user.getId())) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body("You cannot access this address.");
            }

            return ResponseEntity.ok(
                    convertToDTO(address)
            );

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to load address.");
        }
    }

    // ==========================================
    // UPDATE ADDRESS
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(
            @PathVariable Long id,
            @RequestBody Address address,
            Authentication authentication) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Please login first.");
            }

            String username = authentication.getName();

            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User not found.");
            }

            Address existingAddress =
                    addressRepository.findById(id).orElse(null);

            if (existingAddress == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Address not found.");
            }

            if (!existingAddress.getUser().getId().equals(user.getId())) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body("You cannot update this address.");
            }

            existingAddress.setFullName(
                    address.getFullName()
            );

            existingAddress.setPhone(
                    address.getPhone()
            );

            existingAddress.setAddressLine(
                    address.getAddressLine()
            );

            existingAddress.setCity(
                    address.getCity()
            );

            existingAddress.setState(
                    address.getState()
            );

            existingAddress.setPostalCode(
                    address.getPostalCode()
            );

            existingAddress.setCountry(
                    address.getCountry()
            );

            Address updatedAddress =
                    addressRepository.save(existingAddress);

            return ResponseEntity.ok(
                    convertToDTO(updatedAddress)
            );

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to update address.");
        }
    }

    // ==========================================
    // DELETE ADDRESS
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(
            @PathVariable Long id,
            Authentication authentication) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Please login first.");
            }

            String username = authentication.getName();

            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User not found.");
            }

            Address address =
                    addressRepository.findById(id).orElse(null);

            if (address == null) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Address not found.");
            }

            if (!address.getUser().getId().equals(user.getId())) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body("You cannot delete this address.");
            }

            addressRepository.delete(address);

            return ResponseEntity
                    .ok("Address deleted successfully.");

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to delete address.");
        }
    }

    // ==========================================
    // CONVERT ADDRESS TO DTO
    // ==========================================

    private AddressResponseDTO convertToDTO(
            Address address) {

        return new AddressResponseDTO(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getAddressLine(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry()
        );
    }
}