package com.shopora.shopora.config;

import com.shopora.shopora.model.User;
import com.shopora.shopora.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner createAdmin(UserRepository userRepository) {

        return args -> {

            String adminUsername = "admin";
            String adminEmail = "admin@shopora.com";

            if (userRepository.findByUsername(adminUsername).isEmpty()) {

                BCryptPasswordEncoder passwordEncoder =
                        new BCryptPasswordEncoder();

                User admin = new User();

                admin.setName("Shopora Admin");
                admin.setUsername(adminUsername);
                admin.setEmail(adminEmail);

                // Change this password later
                admin.setPassword(
                        passwordEncoder.encode("Admin@12345")
                );

                admin.setRole("ADMIN");

                userRepository.save(admin);

                System.out.println(
                        "===== SHOPORA ADMIN CREATED ====="
                );
                System.out.println(
                        "Username: admin"
                );
                System.out.println(
                        "Password: Admin@12345"
                );
                System.out.println(
                        "================================="
                );
            }
        };
    }
}