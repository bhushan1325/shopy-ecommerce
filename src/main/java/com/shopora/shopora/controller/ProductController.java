package com.shopora.shopora.controller;

import com.shopora.shopora.model.Product;
import com.shopora.shopora.repository.ProductRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;


    public ProductController(
            ProductRepository productRepository
    ) {
        this.productRepository = productRepository;
    }


    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product
    ) {

        if (product.getActive() == null) {
            product.setActive(true);
        }

        if (product.getRating() == null) {
            product.setRating(0.0);
        }

        if (product.getReviewCount() == null) {
            product.setReviewCount(0);
        }

        Product savedProduct =
                productRepository.save(product);

        return ResponseEntity.ok(savedProduct);
    }


    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size,

            @RequestParam(
                    defaultValue = "id"
            )
            String sortBy,

            @RequestParam(
                    defaultValue = "asc"
            )
            String direction
    ) {

        Sort sort;

        if (direction.equalsIgnoreCase("desc")) {
            sort = Sort.by(sortBy).descending();
        } else {
            sort = Sort.by(sortBy).ascending();
        }

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sort
                );

        return ResponseEntity.ok(
                productRepository.findAll(pageable)
        );
    }


    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(

            @RequestParam
            String keyword,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByNameContainingIgnoreCase(
                                keyword,
                                pageable
                        )
        );
    }


    @GetMapping("/brand")
    public ResponseEntity<Page<Product>> getByBrand(

            @RequestParam
            String brand,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByBrandIgnoreCase(
                                brand,
                                pageable
                        )
        );
    }


    @GetMapping("/price")
    public ResponseEntity<Page<Product>> getByPrice(

            @RequestParam
            Double minPrice,

            @RequestParam
            Double maxPrice,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByPriceBetween(
                                minPrice,
                                maxPrice,
                                pageable
                        )
        );
    }


    @GetMapping("/category")
    public ResponseEntity<Page<Product>> getByCategory(

            @RequestParam
            Long categoryId,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByCategoryId(
                                categoryId,
                                pageable
                        )
        );
    }


    @GetMapping("/age")
    public ResponseEntity<Page<Product>> getByAgeGroup(

            @RequestParam
            String ageGroup,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByAgeGroupIgnoreCase(
                                ageGroup,
                                pageable
                        )
        );
    }


    @GetMapping("/gender")
    public ResponseEntity<Page<Product>> getByGender(

            @RequestParam
            String gender,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByGenderIgnoreCase(
                                gender,
                                pageable
                        )
        );
    }


    @GetMapping("/subcategory")
    public ResponseEntity<Page<Product>> getBySubcategory(

            @RequestParam
            String subcategory,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findBySubcategoryIgnoreCase(
                                subcategory,
                                pageable
                        )
        );
    }


    @GetMapping("/material")
    public ResponseEntity<Page<Product>> getByMaterial(

            @RequestParam
            String material,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByMaterialIgnoreCase(
                                material,
                                pageable
                        )
        );
    }


    @GetMapping("/style")
    public ResponseEntity<Page<Product>> getByStyle(

            @RequestParam
            String style,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByStyleIgnoreCase(
                                style,
                                pageable
                        )
        );
    }


    @GetMapping("/active")
    public ResponseEntity<Page<Product>> getActiveProducts(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByActiveTrue(
                                pageable
                        )
        );
    }


    @GetMapping("/age/active")
    public ResponseEntity<Page<Product>> getActiveProductsByAge(

            @RequestParam
            String ageGroup,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByAgeGroupIgnoreCaseAndActiveTrue(
                                ageGroup,
                                pageable
                        )
        );
    }


    @GetMapping("/gender/active")
    public ResponseEntity<Page<Product>> getActiveProductsByGender(

            @RequestParam
            String gender,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size
                );

        return ResponseEntity.ok(
                productRepository
                        .findByGenderIgnoreCaseAndActiveTrue(
                                gender,
                                pageable
                        )
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(
            @PathVariable Long id
    ) {

        return productRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(
                        () ->
                                ResponseEntity
                                        .notFound()
                                        .build()
                );
    }


    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(

            @PathVariable Long id,

            @RequestBody Product product
    ) {

        return productRepository
                .findById(id)
                .map(existingProduct -> {

                    existingProduct.setName(
                            product.getName()
                    );

                    existingProduct.setDescription(
                            product.getDescription()
                    );

                    existingProduct.setPrice(
                            product.getPrice()
                    );

                    existingProduct.setSalePrice(
                            product.getSalePrice()
                    );

                    existingProduct.setStock(
                            product.getStock()
                    );

                    existingProduct.setBrand(
                            product.getBrand()
                    );

                    existingProduct.setImageUrl(
                            product.getImageUrl()
                    );

                    existingProduct.setAgeGroup(
                            product.getAgeGroup()
                    );

                    existingProduct.setGender(
                            product.getGender()
                    );

                    existingProduct.setSubcategory(
                            product.getSubcategory()
                    );

                    existingProduct.setMaterial(
                            product.getMaterial()
                    );

                    existingProduct.setStyle(
                            product.getStyle()
                    );

                    existingProduct.setFit(
                            product.getFit()
                    );

                    existingProduct.setCareInstructions(
                            product.getCareInstructions()
                    );

                    existingProduct.setSku(
                            product.getSku()
                    );

                    existingProduct.setBadge(
                            product.getBadge()
                    );

                    existingProduct.setRating(
                            product.getRating()
                    );

                    existingProduct.setReviewCount(
                            product.getReviewCount()
                    );

                    existingProduct.setActive(
                            product.getActive()
                    );

                    existingProduct.setCategory(
                            product.getCategory()
                    );

                    Product updatedProduct =
                            productRepository.save(
                                    existingProduct
                            );

                    return ResponseEntity.ok(
                            updatedProduct
                    );
                })
                .orElseGet(
                        () ->
                                ResponseEntity
                                        .notFound()
                                        .build()
                );
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id
    ) {

        if (!productRepository.existsById(id)) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        productRepository.deleteById(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}