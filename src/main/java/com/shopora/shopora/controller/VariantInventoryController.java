package com.shopora.shopora.controller;

import com.shopora.shopora.model.ProductVariant;
import com.shopora.shopora.repository.ProductVariantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory/variant")
public class VariantInventoryController {

    private final ProductVariantRepository productVariantRepository;

    public VariantInventoryController(
            ProductVariantRepository productVariantRepository) {

        this.productVariantRepository =
                productVariantRepository;
    }

    @PutMapping("/{variantId}")
    public ResponseEntity<ProductVariant> updateVariantStock(
            @PathVariable Long variantId,
            @RequestParam Integer stock) {

        ProductVariant variant =
                productVariantRepository.findById(variantId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Variant not found"
                                ));

        if (stock < 0) {
            throw new RuntimeException(
                    "Stock cannot be negative"
            );
        }

        variant.setStock(stock);

        ProductVariant updatedVariant =
                productVariantRepository.save(variant);

        return ResponseEntity.ok(updatedVariant);
    }
}