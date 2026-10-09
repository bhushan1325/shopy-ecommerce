package com.shopora.shopora.dto;

public class AdminDashboardDTO {

    private long totalUsers;
    private long totalProducts;
    private long totalOrders;
    private double totalRevenue;

    public AdminDashboardDTO(
            long totalUsers,
            long totalProducts,
            long totalOrders,
            double totalRevenue) {

        this.totalUsers = totalUsers;
        this.totalProducts = totalProducts;
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }
}