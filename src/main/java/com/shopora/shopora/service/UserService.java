package com.shopora.shopora.service;

import com.shopora.shopora.dto.LoginRequestDTO;
import com.shopora.shopora.dto.ProfileUpdateDTO;
import com.shopora.shopora.exception.InvalidLoginException;
import com.shopora.shopora.exception.UserAlreadyExistsException;
import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(User user) {

        if (userRepository.findByUsername(
                user.getUsername()
        ).isPresent()) {

            throw new UserAlreadyExistsException(
                    "Username already exists"
            );
        }

        if (userRepository.findByEmail(
                user.getEmail()
        ).isPresent()) {

            throw new UserAlreadyExistsException(
                    "Email already exists"
            );
        }

        user.setRole("CUSTOMER");

        String hashedPassword =
                passwordEncoder.encode(
                        user.getPassword()
                );

        user.setPassword(hashedPassword);

        return userRepository.save(user);
    }

    public User loginUser(
            LoginRequestDTO loginRequest) {

        User user = userRepository
                .findByUsername(
                        loginRequest.getUsername()
                )
                .orElseThrow(() ->
                        new InvalidLoginException(
                                "Invalid username or password"
                        )
                );

        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                user.getPassword()
        )) {

            throw new InvalidLoginException(
                    "Invalid username or password"
            );
        }

        return user;
    }

    public User getUserByUsername(String username) {

        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }

    public User updateProfile(
            String currentUsername,
            ProfileUpdateDTO profileUpdate) {

        User user = getUserByUsername(
                currentUsername
        );

        if (!user.getEmail().equalsIgnoreCase(
                profileUpdate.getEmail()
        )) {

            userRepository
                    .findByEmail(
                            profileUpdate.getEmail()
                    )
                    .ifPresent(existingUser -> {

                        if (!existingUser.getId()
                                .equals(user.getId())) {

                            throw new UserAlreadyExistsException(
                                    "Email already exists"
                            );
                        }
                    });
        }

        user.setName(
                profileUpdate.getName()
        );

        user.setEmail(
                profileUpdate.getEmail()
        );

        return userRepository.save(user);
    }
}