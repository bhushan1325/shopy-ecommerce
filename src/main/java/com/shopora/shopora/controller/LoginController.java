package com.shopora.shopora.controller;

import com.shopora.shopora.dto.LoginRequestDTO;
import com.shopora.shopora.dto.UserResponseDTO;
import com.shopora.shopora.model.User;
import com.shopora.shopora.service.JwtService;
import com.shopora.shopora.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class LoginController {

    private final UserService userService;
    private final JwtService jwtService;

    public LoginController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginUser(
            @RequestBody LoginRequestDTO loginRequest) {

        User user = userService.loginUser(loginRequest);

        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );

        UserResponseDTO response = new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "user", response
                )
        );
    }
}