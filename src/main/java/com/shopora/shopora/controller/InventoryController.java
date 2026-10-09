package com.shopora.shopora.controller;

import com.shopora.shopora.model.Product;
import com.shopora.shopora.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory")
public class InventoryController {

    private final ProductRepository productRepository;

    public InventoryController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PutMapping("/product/{productId}")
    public ResponseEntity<Product> updateProductStock(
            @PathVariable Long productId,
            @RequestParam Integer stock) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        if (stock < 0) {
            throw new RuntimeException(
                    "Stock cannot be negative"
            );
        }

        product.setStock(stock);

        Product updatedProduct =
                productRepository.save(product);

        return ResponseEntity.ok(updatedProduct);
    }
}