package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.HistoricalMonthStats;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryQueries;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class HistoricalDataEngineTest
{
    @Mock
    private CSVTransactionService csvTransactionService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private BudgetCategoryService budgetCategoryService;

    private HistoricalDataEngine historicalDataEngine;

    @BeforeEach
    void setUp() {
        historicalDataEngine = new HistoricalDataEngine(csvTransactionService, transactionService, budgetCategoryService);
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenNumberOfMonthsIsZero_thenReturnEmptyMap(){
        int numberOfMonths = 0;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        Map<String, HistoricalMonthStats> actual = historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenOneMonthBack_thenReturnCategoryStats(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        Map<String, HistoricalMonthStats> expected = new HashMap<>();


    }



    @AfterEach
    void tearDown() {
    }
}