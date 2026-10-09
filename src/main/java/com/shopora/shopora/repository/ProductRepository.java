package com.shopora.shopora.repository;

import com.shopora.shopora.model.Product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    Page<Product> findAll(Pageable pageable);


    Page<Product> findByNameContainingIgnoreCase(
            String keyword,
            Pageable pageable
    );


    Page<Product> findByBrandIgnoreCase(
            String brand,
            Pageable pageable
    );


    Page<Product> findByPriceBetween(
            Double minPrice,
            Double maxPrice,
            Pageable pageable
    );


    Page<Product> findByCategoryId(
            Long categoryId,
            Pageable pageable
    );


    Page<Product> findByAgeGroupIgnoreCase(
            String ageGroup,
            Pageable pageable
    );


    Page<Product> findByGenderIgnoreCase(
            String gender,
            Pageable pageable
    );


    Page<Product> findBySubcategoryIgnoreCase(
            String subcategory,
            Pageable pageable
    );


    Page<Product> findByMaterialIgnoreCase(
            String material,
            Pageable pageable
    );


    Page<Product> findByStyleIgnoreCase(
            String style,
            Pageable pageable
    );


    Page<Product> findByActiveTrue(
            Pageable pageable
    );


    Page<Product> findByAgeGroupIgnoreCaseAndActiveTrue(
            String ageGroup,
            Pageable pageable
    );


    Page<Product> findByGenderIgnoreCaseAndActiveTrue(
            String gender,
            Pageable pageable
    );
}