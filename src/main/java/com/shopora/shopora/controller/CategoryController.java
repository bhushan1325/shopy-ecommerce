package com.shopora.shopora.controller;

import com.shopora.shopora.model.Category;
import com.shopora.shopora.repository.CategoryRepository;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;


    public CategoryController(
            CategoryRepository categoryRepository
    ) {
        this.categoryRepository =
                categoryRepository;
    }


    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category
    ) {

        Category savedCategory =
                categoryRepository.save(category);

        return ResponseEntity.ok(
                savedCategory
        );
    }


    @GetMapping
    public ResponseEntity<List<Category>> getCategories() {

        return ResponseEntity.ok(
                categoryRepository.findAll()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategory(
            @PathVariable Long id
    ) {

        return categoryRepository
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
    public ResponseEntity<Category> updateCategory(

            @PathVariable Long id,

            @RequestBody Category category
    ) {

        return categoryRepository
                .findById(id)
                .map(existingCategory -> {

                    existingCategory.setName(
                            category.getName()
                    );

                    existingCategory.setDescription(
                            category.getDescription()
                    );

                    existingCategory.setType(
                            category.getType()
                    );

                    existingCategory.setAgeGroup(
                            category.getAgeGroup()
                    );

                    Category updatedCategory =
                            categoryRepository.save(
                                    existingCategory
                            );

                    return ResponseEntity.ok(
                            updatedCategory
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
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id
    ) {

        if (!categoryRepository.existsById(id)) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        categoryRepository.deleteById(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}