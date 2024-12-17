package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriodParams;
import com.app.budgetbuddy.domain.BudgetStatus;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetPeriodQueriesTest {

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private BudgetPeriodQueries budgetPeriodQueries;

    private Budget testBudget;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setActual(new BigDecimal("1630"));
        testBudget.setBudgetAmount(new BigDecimal("3260"));
        testBudget.setBudgetDescription("Savings Budget");
        testBudget.setBudgetName("Savings Budget");
        testBudget.setStartDate(LocalDate.of(2024, 10, 1));
        testBudget.setEndDate(LocalDate.of(2024, 10, 31));
        budgetPeriodQueries = new BudgetPeriodQueries(entityManager);
    }

    @Test
    void testGetDailyBudgetPeriodQuery_whenDateIsNull_thenThrowIllegalDateException(){

        assertThrows(IllegalDateException.class, () -> budgetPeriodQueries.getDailyBudgetPeriodQuery(null, testBudget));
    }

    @Test
    void testGetDailyBudgetPeriodQuery_whenBudgetIsNull_thenThrowIllegalArgumentException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetPeriodQueries.getDailyBudgetPeriodQuery(LocalDate.of(2024, 10, 1), null);
        });
    }

    @Test
    void testGetDailyBudgetPeriodQuery_whenSingleDateAndBudgetValid_thenReturnBudgetPeriodParams(){
        final LocalDate dailyDate = LocalDate.of(2024, 10, 1);
        final BigDecimal budgeted = new BigDecimal("3260");
        final BigDecimal actual = new BigDecimal("1630");
        final DateRange dateRange = new DateRange(dailyDate, dailyDate);
        final BudgetStatus budgetStatus = BudgetStatus.GOOD;
        List<BudgetPeriodParams> expectedBudgetPeriodParams = new ArrayList<>();
        BudgetPeriodParams budgetPeriodParams = new BudgetPeriodParams("Rent", budgeted, actual, dateRange, budgetStatus);
        expectedBudgetPeriodParams.add(budgetPeriodParams);

        List<BudgetPeriodParams> actualBudgetPeriodQuery = budgetPeriodQueries.getDailyBudgetPeriodQuery(dailyDate, testBudget);

        for(int i = 0; i < actualBudgetPeriodQuery.size(); i++){
            assertEquals(expectedBudgetPeriodParams.get(i).getBudgeted(), actualBudgetPeriodQuery.get(i).getBudgeted());
            assertEquals(expectedBudgetPeriodParams.get(i).getActual(), actualBudgetPeriodQuery.get(i).getActual());
            assertEquals(expectedBudgetPeriodParams.get(i).getDateRange(), actualBudgetPeriodQuery.get(i).getDateRange());
            assertEquals(expectedBudgetPeriodParams.get(i).getBudgetStatus(), actualBudgetPeriodQuery.get(i).getBudgetStatus());
            assertFalse(actualBudgetPeriodQuery.get(i).isOverBudget());
            assertEquals(0.5, actualBudgetPeriodQuery.get(i).getSpendingPercentage());
            assertEquals(new BigDecimal("1630"), actualBudgetPeriodQuery.get(i).getRemaining());
        }

    }

    @AfterEach
    void tearDown() {
    }
}