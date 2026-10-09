package com.shopora.shopora.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

            // =====================================
            // CSRF
            // =====================================

            .csrf(csrf ->
                    csrf.disable()
            )


            // =====================================
            // SESSION
            // =====================================

            .sessionManagement(session ->
                    session.sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )


            // =====================================
            // AUTHORIZATION
            // =====================================

            .authorizeHttpRequests(auth -> auth


                // =================================
                // PUBLIC FRONTEND PAGES
                // =================================

                .requestMatchers(
                        "/",
                        "/index.html",
                        "/login.html",
                        "/register.html",
                        "/product.html",
                        "/cart.html",
                        "/wishlist.html",
                        "/checkout.html",
                        "/payment.html",
                        "/orders.html",
                        "/tracking.html",
                        "/profile.html",
                        "/admin.html",
                        "/order-success.html"
                )
                .permitAll()


                // =================================
                // PUBLIC STATIC FILES
                // =================================

                .requestMatchers(
                        "/**/*.css",
                        "/**/*.js",
                        "/**/*.png",
                        "/**/*.jpg",
                        "/**/*.jpeg",
                        "/**/*.webp",
                        "/**/*.svg",
                        "/**/*.ico",
                        "/style.css",
                        "/orders.css",
                        "/tracking.css",
                        "/product.css",
                        "/cart.css",
                        "/wishlist.css",
                        "/admin.css"
                )
                .permitAll()


                // =================================
                // LOGIN / REGISTER
                // =================================

                .requestMatchers(
                        "/api/users/login",
                        "/api/users/register",
                        "/api/auth/**",
                        "/api/login/**",
                        "/api/register/**"
                )
                .permitAll()


                // =================================
                // PRODUCTS
                // =================================

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/products/**"
                )
                .permitAll()

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/products/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/products/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.DELETE,
                        "/api/products/**"
                )
                .hasRole("ADMIN")


                // =================================
                // CATEGORIES
                // =================================

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/categories/**"
                )
                .permitAll()

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/categories/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/categories/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.DELETE,
                        "/api/categories/**"
                )
                .hasRole("ADMIN")


                // =================================
                // PRODUCT VARIANTS
                // =================================

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/variants/**"
                )
                .permitAll()

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/variants/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/variants/**"
                )
                .hasRole("ADMIN")

                .requestMatchers(
                        HttpMethod.DELETE,
                        "/api/variants/**"
                )
                .hasRole("ADMIN")


                // =================================
                // REVIEWS
                // =================================

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/reviews/**"
                )
                .permitAll()

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/reviews/**"
                )
                .authenticated()

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/reviews/**"
                )
                .authenticated()

                .requestMatchers(
                        HttpMethod.DELETE,
                        "/api/reviews/**"
                )
                .authenticated()


                // =================================
                // CART
                // =================================

                .requestMatchers(
                        "/api/cart/**"
                )
                .authenticated()


                // =================================
                // PAYMENTS
                // =================================

                .requestMatchers(
                        "/api/payments/**"
                )
                .authenticated()


                // =================================
                // ADDRESSES
                // =================================

                .requestMatchers(
                        "/api/addresses/**"
                )
                .authenticated()


                // =================================
                // ADMIN
                // =================================

                .requestMatchers(
                        "/api/admin/**"
                )
                .hasRole("ADMIN")


                // =================================
                // EVERYTHING ELSE
                // =================================

                .anyRequest()
                .authenticated()
            )


            // =====================================
            // JWT FILTER
            // =====================================

            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );


        return http.build();
    }


    // =========================================
    // PASSWORD ENCODER
    // =========================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }
}