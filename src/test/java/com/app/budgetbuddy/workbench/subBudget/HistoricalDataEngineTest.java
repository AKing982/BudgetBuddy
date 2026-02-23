package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.HistoricalMonthStats;
import com.app.budgetbuddy.domain.MonthHistory;
import com.app.budgetbuddy.exceptions.HistoricalDataException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryQueries;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class HistoricalDataEngineTest
{
    @Mock
    private TransactionCategoryQueries transactionCategoryQueries;

    @Mock
    private BudgetCategoryService budgetCategoryService;

    private HistoricalDataEngine historicalDataEngine;

    @BeforeEach
    void setUp() {
        historicalDataEngine = new HistoricalDataEngine(transactionCategoryQueries, budgetCategoryService);
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
    void testGetHistoricalMonthStatsByCategory_whenNumberOfMonthsIsNegative_thenThrowException(){
        int numberOfMonths = -1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenOneMonthBack_thenReturnCategoryStats(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        Map<String, HistoricalMonthStats> expected = new HashMap<>();
        HistoricalMonthStats groceryHistoricalMonthStats = new HistoricalMonthStats(
                YearMonth.of(2025, 9), YearMonth.of(2025, 9), 450.00, 450.00);
        expected.put("Groceries", groceryHistoricalMonthStats);
        HistoricalMonthStats paymentHistoricalMonthStats = new HistoricalMonthStats(
                YearMonth.of(2025, 9), YearMonth.of(2025, 9), 120.0, 120.0);

        expected.put("Payment", paymentHistoricalMonthStats);

        LocalDate monthStart = LocalDate.of(2025, 9, 1);
        LocalDate monthEnd = LocalDate.of(2025, 9, 30);

        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, monthStart, monthEnd))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-09", 450.00},
                        new Object[]{"Payment", "2025-09", 120.00}
                ));

        Map<String, HistoricalMonthStats> actual = historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenFourMonthsBack_thenReturnCategoryStats(){
        int numberOfMonths = 4;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 2, 1);

        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2026-01", 300.00},
                        new Object[]{"Payment", "2026-01", -100.00}
                ));
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 31)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-12", -150.00},
                        new Object[]{"Payment", "2025-12", 200.00}
                ));
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-11", 450.00},
                        new Object[]{"Payment", "2025-11", -300.00}
                ));
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2025, 10, 1), LocalDate.of(2025, 10, 31)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-10", 100.00},
                        new Object[]{"Payment", "2025-10", 50.00}
                ));

        Map<String, HistoricalMonthStats> expected = new HashMap<>();
        expected.put("Groceries", new HistoricalMonthStats(YearMonth.of(2025, 12), YearMonth.of(2025, 11), 450.00, -150.00));
        expected.put("Payment", new HistoricalMonthStats(YearMonth.of(2025, 11), YearMonth.of(2025, 12), 200.00, -300.00));

        Map<String, HistoricalMonthStats> actual = historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenCategoryKeyIsNull_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{null, "2026-09", 300.00},
                        new Object[]{"Payment", "2026-09", -100.00}
                ));

        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenCategoryKeyIsEmpty_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"", "2026-09", 300.00},
                        new Object[]{"Payment", "2026-09", -100.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenMonthIsNull_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", null, 300.00},
                        new Object[]{"Payment", "2026-09", -100.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenMonthIsEmpty_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "", 300.00},
                        new Object[]{"Payment", "2026-09", -100.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthStatsByCategory_whenKeyAndMonthMissing_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthStatsByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{null, null, 300.00},
                        new Object[]{"Payment", "2026-09", -100.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthStatsByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenNumberOfMonthsIsZero_thenReturnEmptyMap(){
        int numberOfMonths = 0;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        Map<String, List<MonthHistory>> actual = historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenNumberOfMonthsIsNegative_thenThrowException(){
        int numberOfMonths = -1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenThreeMonthsBack_thenReturnMonthHistoryData(){
        int numberOfMonths = 3;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 2, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2026-01", 150.00, 200.00, 350.00, 57.14, 75.00, 100.00},
                        new Object[]{"Payment", "2026-01", -50.00, 250.00, 200.00, 125.00, -25.00, 125.00}
                ));
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 31)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-12", 300.00, 100.00, 400.00, 25.00, 150.00, 50.00},
                        new Object[]{"Payment", "2025-12", 80.00, 120.00, 200.00, 60.00, 40.00, 60.00}
                ));
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2025-11", 50.00, 280.00, 330.00, 84.85, 25.00, 140.00},
                        new Object[]{"Payment", "2025-11", -100.00, 300.00, 200.00, 150.00, -50.00, 150.00}
                ));

        Map<String, List<MonthHistory>> expected = new HashMap<>();
        expected.put("Groceries", List.of(
                new MonthHistory(YearMonth.of(2026, 1), 150.00, 200.00, 57.14, 350.00, 75.00, 100.00),
                new MonthHistory(YearMonth.of(2025, 12), 300.00, 100.00, 25.00, 400.00, 150.00, 50.00),
                new MonthHistory(YearMonth.of(2025, 11), 50.00, 280.00, 84.85, 330.00, 25.00, 140.00)
        ));
        expected.put("Payment", List.of(
                new MonthHistory(YearMonth.of(2026, 1), -50.00, 250.00, 125.00, 200.00, -25.00, 125.00),
                new MonthHistory(YearMonth.of(2025, 12), 80.00, 120.00, 60.00, 200.00, 40.00, 60.00),
                new MonthHistory(YearMonth.of(2025, 11), -100.00, 300.00, 150.00, 200.00, -50.00, 150.00)
        ));

        Map<String, List<MonthHistory>> actual = historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenCategoryKeyIsMissingThenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{null, "2026-09", 150.00, 200.00, 350.00, 57.14, 75.00, 100.00},
                        new Object[]{"Payment", "2026-09", -50.00, 250.00, 200.00, 125.00, -25.00, 125.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenCategoryKeyIsEmpty_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"", "2026-09", 150.00, 200.00, 350.00, 57.14, 75.00, 100.00},
                        new Object[]{"Payment", "2026-09", -50.00, 250.00, 200.00, 125.00, -25.00, 125.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenMonthIsNull_thenThrowException(){
        int numberOfMonths = 1;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", null, 150.00, 200.00, 350.00, 57.14, 75.00, 100.00},
                        new Object[]{"Payment", "2026-09", -50.00, 250.00, 200.00, 125.00, -25.00, 125.00}
                ));
        assertThrows(HistoricalDataException.class, () -> {
            historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        });
    }

    @Test
    void testGetHistoricalMonthHistoryByCategory_whenNumberOfMonthResultsIsLessThanNumberOfMonths_thenReturnMaxMonthHistories(){
        int numberOfMonths = 5;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 10, 1);

        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new Object[]{"Groceries", "2026-09", 150.00, 200.00, 350.00, 57.14, 75.00, 100.00},
                        new Object[]{"Payment", "2026-09", -50.00, 250.00, 200.00, 125.00, -25.00, 125.00}
                ));

        // remaining months return empty
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31))).thenReturn(List.of());
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31))).thenReturn(List.of());
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30))).thenReturn(List.of());
        Mockito.when(budgetCategoryService.getHistoricalMonthHistoryByCategory(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31))).thenReturn(List.of());

        Map<String, List<MonthHistory>> actual = historicalDataEngine.getHistoricalMonthHistoryByCategory(numberOfMonths, userId, startDate);
        assertNotNull(actual);
        assertEquals(2, actual.size());
        assertEquals(1, actual.get("Groceries").size());
        assertEquals(1, actual.get("Payment").size());
        assertEquals(YearMonth.of(2026, 9), actual.get("Groceries").get(0).month());
    }



    @AfterEach
    void tearDown() {
    }
}