package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.services.TransactionLoaderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CategoryRuleEngineTest {

    @Mock
    private CategoryRuleCreator categoryRuleCreator;

    @Mock
    private TransactionCategorizer transactionCategorizer;

    @Mock
    private TransactionLoaderService transactionLoaderService;

    @InjectMocks
    private CategoryRuleEngine categoryRuleEngine;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }



    @AfterEach
    void tearDown() {
    }
}