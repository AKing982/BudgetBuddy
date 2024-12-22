package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionCategoryRunnerTest {

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @Mock
    private TransactionCategoryBuilder transactionCategoryBuilder;

    @InjectMocks
    private TransactionCategoryRunner transactionCategoryRunner;

    @BeforeEach
    void setUp() {
        transactionCategoryRunner = new TransactionCategoryRunner(transactionCategoryService, transactionCategoryBuilder, transactionService, budgetService,categoryService, recurringTransactionService);

    }

    @AfterEach
    void tearDown() {
    }
}