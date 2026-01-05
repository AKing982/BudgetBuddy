package com.app.budgetbuddy.services;

import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetConverterUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@SpringBootTest
class BudgetServiceImplTest
{
    @Autowired
    private BudgetService budgetService;

    @MockBean
    private BudgetRepository budgetRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private SubBudgetRepository subBudgetRepository;

    @MockBean
    private SubBudgetConverterUtil subBudgetConverterUtil;


    @Test
    @DisplayName("Should return false when userId is null")
    void validateBudgetExistsForYear_WithNullUserId_ShouldReturnFalse() {
        // Arrange
        Long userId = null;
        Integer year = 2024;

        // Act
        boolean result = budgetService.validateBudgetExistsForYear(userId, year);

        // Assert
        assertFalse(result, "Expected false when userId is null");
        verify(budgetRepository, never()).existsByUserIdAndYear(anyLong(), anyInt());
    }

    @Test
    @DisplayName("Should return false when userId is null")
    void validateBudgetExistsForYear_WithUserId_ShouldReturnTrue() {
        // Arrange
        Long userId = 1L;
        int year = 2026;
        when(budgetRepository.existsByUserIdAndYear(anyLong(), anyInt())).thenReturn(true);

        // Act
        boolean result = budgetService.validateBudgetExistsForYear(userId, year);

        // Assert
        assertTrue(result, "Expected true when userId is 1L and year is 2026");
        verify(budgetRepository, times(1)).existsByUserIdAndYear(userId, year);
    }

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}