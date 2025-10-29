package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.workbench.budget.BudgetCategoryQueries;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class HistoricalSubBudgetServiceTest
{

    @MockBean
    private EntityManager entityManager;

    @MockBean
    private BudgetCategoryQueries budgetCategoryQueries;

    @Autowired
    private HistoricalSubBudgetService historicalSubBudgetService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}