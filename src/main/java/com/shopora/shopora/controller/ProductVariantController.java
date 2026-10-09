package com.shopora.shopora.controller;

import com.shopora.shopora.model.ProductVariant;
import com.shopora.shopora.repository.ProductVariantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/variants")
public class ProductVariantController {

    private final ProductVariantRepository variantRepository;

    public ProductVariantController(
            ProductVariantRepository variantRepository) {

        this.variantRepository = variantRepository;
    }

    // Create a product variant
    @PostMapping
    public ResponseEntity<ProductVariant> createVariant(
            @RequestBody ProductVariant variant) {

        ProductVariant savedVariant =
                variantRepository.save(variant);

        return ResponseEntity.ok(savedVariant);
    }

    // Get all variants
    @GetMapping
    public ResponseEntity<List<ProductVariant>> getAllVariants() {

        return ResponseEntity.ok(
                variantRepository.findAll()
        );
    }

    // Get variants of a specific product
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductVariant>> getVariantsByProduct(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                variantRepository.findByProductId(productId)
        );
    }

    // Get variant by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductVariant> getVariantById(
            @PathVariable Long id) {

        return variantRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update variant
    @PutMapping("/{id}")
    public ResponseEntity<ProductVariant> updateVariant(
            @PathVariable Long id,
            @RequestBody ProductVariant variant) {

        return variantRepository.findById(id)
                .map(existingVariant -> {

                    existingVariant.setVariantName(
                            variant.getVariantName()
                    );

                    existingVariant.setValue(
                            variant.getValue()
                    );

                    existingVariant.setAdditionalPrice(
                            variant.getAdditionalPrice()
                    );

                    existingVariant.setStock(
                            variant.getStock()
                    );

                    existingVariant.setProduct(
                            variant.getProduct()
                    );

                    ProductVariant updatedVariant =
                            variantRepository.save(
                                    existingVariant
                            );

                    return ResponseEntity.ok(
                            updatedVariant
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete variant
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVariant(
            @PathVariable Long id) {

        if (!variantRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        variantRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // Get final price of a product variant
    @GetMapping("/price/{id}")
    public ResponseEntity<Double> getVariantFinalPrice(
            @PathVariable Long id) {

        return variantRepository.findById(id)
                .map(variant -> {

                    double productPrice =
                            variant.getProduct().getPrice();

                    double additionalPrice =
                            variant.getAdditionalPrice() != null
                                    ? variant.getAdditionalPrice()
                                    : 0.0;

                    double finalPrice =
                            productPrice + additionalPrice;

                    return ResponseEntity.ok(finalPrice);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}