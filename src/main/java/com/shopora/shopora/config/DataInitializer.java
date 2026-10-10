package com.shopora.shopora.config;

import com.shopora.shopora.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DataSource dataSource;
    private final CategoryRepository categoryRepository;

    public DataInitializer(DataSource dataSource, CategoryRepository categoryRepository) {
        this.dataSource = dataSource;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        try {
            if (categoryRepository.count() == 0) {
                log.info(">> Cloud database empty. Auto-seeding catalog categories and products from data-seed.sql...");
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
                populator.setContinueOnError(true);
                populator.setIgnoreFailedDrops(true);
                populator.addScript(new ClassPathResource("data-seed.sql"));
                populator.execute(dataSource);
                log.info(">> Catalog auto-seeding completed successfully! Found {} categories.", categoryRepository.count());
            } else {
                log.info(">> Database already populated with {} categories.", categoryRepository.count());
            }
        } catch (Exception e) {
            log.warn(">> Database auto-seeding notice: {}", e.getMessage());
        }
    }
}
