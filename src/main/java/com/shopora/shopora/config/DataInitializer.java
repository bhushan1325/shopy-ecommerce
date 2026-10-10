package com.shopora.shopora.config;

import com.shopora.shopora.repository.ProductRepository;
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
    private final ProductRepository productRepository;

    public DataInitializer(DataSource dataSource, ProductRepository productRepository) {
        this.dataSource = dataSource;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        try {
            if (productRepository.count() == 0) {
                log.info(">> Cloud product catalog is empty. Auto-seeding products and categories from data-seed.sql...");
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
                populator.setContinueOnError(true);
                populator.setIgnoreFailedDrops(true);
                populator.addScript(new ClassPathResource("data-seed.sql"));
                populator.execute(dataSource);
                log.info(">> Product auto-seeding completed! Found {} products in database.", productRepository.count());
            } else {
                log.info(">> Database already populated with {} products.", productRepository.count());
            }
        } catch (Exception e) {
            log.warn(">> Database auto-seeding notice: {}", e.getMessage());
        }
    }
}
