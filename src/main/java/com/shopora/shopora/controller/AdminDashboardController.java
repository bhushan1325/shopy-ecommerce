package com.shopora.shopora.controller;

import com.shopora.shopora.dto.AdminDashboardDTO;
import com.shopora.shopora.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(
            AdminDashboardService adminDashboardService) {

        this.adminDashboardService =
                adminDashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {

        AdminDashboardDTO dashboard =
                adminDashboardService.getDashboard();

        return ResponseEntity.ok(dashboard);
    }
}