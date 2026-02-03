package com.app.budgetbuddy.services;

import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PlaidTransactionImportServiceTest {

    @MockBean
    private PlaidTransactionManager plaidTransactionManager;

    @MockBean
    private BudgetCategoryRunner budgetCategoryRunner;

    @MockBean
    private SubBudgetService subBudgetService;

    @Autowired
    private PlaidTransactionImportService plaidTransactionImportService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}