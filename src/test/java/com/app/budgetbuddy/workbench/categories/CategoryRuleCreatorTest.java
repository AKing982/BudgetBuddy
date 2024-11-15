package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.services.CategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CategoryRuleCreatorTest {

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryRuleCreator categoryRuleCreator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }



    @AfterEach
    void tearDown() {
    }
}