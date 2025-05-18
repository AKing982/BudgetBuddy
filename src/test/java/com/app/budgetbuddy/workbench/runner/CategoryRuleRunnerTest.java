package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.services.CategoryRuleThreadService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CategoryRuleRunnerTest
{
    @MockBean
    private CategoryRuleThreadService categoryRuleThreadService;

    @Autowired
    private CategoryRuleRunner categoryRuleRunner;

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}