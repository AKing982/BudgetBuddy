package com.app.budgetbuddy.workbench.budget;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BudgetCategoryQueriesTest
{

    @Autowired
    private BudgetCategoryQueries budgetCategoryQueries;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}