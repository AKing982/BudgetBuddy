package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.SecondaryRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class CategoryRuleRunner
{
    private CategoryRuleEngine categoryRuleEngine;
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    public CategoryRuleRunner(CategoryRuleEngine categoryRuleEngine,
                              @Qualifier("taskExecutor2") ThreadPoolTaskExecutor taskExecutor)
    {
        this.categoryRuleEngine = categoryRuleEngine;
        this.taskExecutor = taskExecutor;
    }

//    public static void main(String[] args){
//        // Initialize Spring Application Context
//        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
//        context.scan("com.app.budgetbuddy"); // Adjust the package name to your project structure
//        context.refresh();
//
//        // Get the CategoryRuleRunner bean from the context
//        CategoryRuleRunner categoryRuleRunner = context.getBean(CategoryRuleRunner.class);
//
//        // Simulate testing categorizeOnNewTransactions
//        System.out.println("Testing categorizeOnNewTransactions...");
//        categoryRuleRunner.categorizeOnNewTransactions(1L);
//
//        // Simulate testing categorizeForUsers
//        System.out.println("Testing categorizeForUsers...");
//        List<Long> userIds = List.of(1L, 2L, 3L, 4L, 5L);
//        categoryRuleRunner.categorizeForUsers(userIds);
//
//        // Simulate testing categorizeOnLogin
//        System.out.println("Testing categorizeOnLogin...");
//        categoryRuleRunner.categorizeOnLogin(1L);
//
//        // Close the application context
//        context.close();
//    }

    /**
     * Run categorization when new transactions sync
     */
//    @Async
//    public void categorizeOnNewTransactions(Long userId) {
//        taskExecutor.execute(() -> {
//            try {
//                log.info("Starting categorization for user {}", userId);
//                boolean success = categoryRuleEngine.processTransactionsForUser(userId);
//                log.info("Completed categorization for user {}: {}",
//                        userId, success ? "Success" : "Failed");
//            } catch (Exception e) {
//                log.error("Error categorizing transactions for user {}", userId, e);
//            }
//        });
//    }
//
//    /**
//     * Run categorization for multiple users (e.g., on system startup)
//     */
//    @Async
//    public void categorizeForUsers(List<Long> userIds) {
//        userIds.forEach(userId -> {
//            taskExecutor.execute(() -> {
//                try {
//                    log.info("Processing user {}", userId);
//                    categoryRuleEngine.processTransactionsForUser(userId);
//                } catch (Exception e) {
//                    log.error("Failed processing user {}", userId, e);
//                }
//            });
//        });
//    }
//
//    /**
//     * Run categorization on user login
//     */
//    @Async
//    public void categorizeOnLogin(Long userId) {
//        // Use different thread pool for login categorization
//        taskExecutor.execute(() -> {
//            try {
//                log.info("Running login categorization for user {}", userId);
//                boolean success = categoryRuleEngine.processTransactionsForUser(userId);
//                if (!success) {
//                    log.warn("Login categorization failed for user {}", userId);
//                }
//            } catch (Exception e) {
//                log.error("Login categorization error for user {}", userId, e);
//            }
//        });
//    }


}
