package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.CSVTransactionRule;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CategoryRunnerTest
{
    @Autowired
    private CategoryRunner categoryRunner;

    @MockBean
    @Qualifier("csvCategorizer")
    private CategorizerService<TransactionCSV> csvCategorizerService;

    @MockBean
    private CSVTransactionService csvTransactionService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}