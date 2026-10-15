package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.PayPeriodStatistics;
import com.app.budgetbuddy.domain.RecurringCategory;
import com.app.budgetbuddy.domain.RecurringType;
import com.app.budgetbuddy.services.PayPeriodStatisticsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayPeriodBudgetStatisticsServiceTest {

    @Mock
    private PayPeriodStatisticsService payPeriodStatisticsService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private TypedQuery<Object[]> typedQuery;

    @InjectMocks
    private PayPeriodStatisticsQueryService payPeriodBudgetStatisticsService;

    private static final Long USER_ID = 1L;
    private static final LocalDate START_DATE = LocalDate.of(2026, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 1, 31);

    @BeforeEach
    void setUp() {
    }

    @Test
    void test_loadRecurring_whenUserIDIsNull_thenReturnEmptyList() {
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(null, START_DATE, END_DATE, RecurringType.BILLS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void test_loadRecurring_whenStartDateIsNull_thenReturnEmptyList() {
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, null, END_DATE, RecurringType.BILLS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void test_loadRecurring_whenEndDateIsNull_thenReturnEmptyList() {
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, START_DATE, null, RecurringType.BILLS);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void test_loadRecurring_whenRecurringTypeIsNull_thenReturnEmptyList() {
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, START_DATE, END_DATE, null);
        assertNotNull(actual);
    }

    @Test
    void loadRecurring_whenQueryReturnsRows_thenReturnRecurringCategories() {
        List<Object[]> rows = List.of(
                new Object[]{"Rent", new BigDecimal("1500.00"), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 15), true},
                new Object[]{"Electric", new BigDecimal("120.50"), LocalDate.of(2026, 1, 3), LocalDate.of(2026, 1, 20), true}
        );

        List<RecurringCategory> expected = new ArrayList<>();
        RecurringCategory rentCategory = new RecurringCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setActive(true);
        rentCategory.setMinAmount(new BigDecimal("1500.00"));
        rentCategory.setFirstDate(LocalDate.of(2026, 1, 1));
        rentCategory.setLastDate(LocalDate.of(2026, 1, 15));

        RecurringCategory electricCategory = new RecurringCategory();
        electricCategory.setCategoryName("Electric");
        electricCategory.setActive(true);
        electricCategory.setMinAmount(new BigDecimal("120.50"));
        electricCategory.setFirstDate(LocalDate.of(2026, 1, 3));
        electricCategory.setLastDate(LocalDate.of(2026, 1, 20));
        expected.add(rentCategory);
        expected.add(electricCategory);

        stubQuery(rows);
        RecurringType recurringType = RecurringType.BILLS;
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, START_DATE, END_DATE, recurringType);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i), actual.get(i));
        }
    }

    @Test
    void test_loadRecurring_whenQueryResultsEmpty_thenReturnEmptyList() {
        List<Object[]> rows = List.of();
        stubQuery(rows);
        RecurringType recurringType = RecurringType.BILLS;
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, START_DATE, END_DATE, recurringType);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void test_loadRecurring_whenQueryResultsNull_thenReturnEmptyList() {
        stubQuery(null);
        RecurringType recurringType = RecurringType.BILLS;
        List<RecurringCategory> actual = payPeriodBudgetStatisticsService.loadRecurring(USER_ID, START_DATE, END_DATE, recurringType);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void test_LoadDaysLeftTillNextIncomeDate_whenUserIdIsNull_thenReturnZero(){
        Integer actual = payPeriodBudgetStatisticsService.loadDaysLeftTillNextIncomeDate(null, START_DATE, END_DATE);
        assertEquals(0, actual);
    }

    @Test
    void test_LoadDaysLeftTillNextIncomeDate_whenStartDateIsNull_thenReturnZero(){
        Integer actual = payPeriodBudgetStatisticsService.loadDaysLeftTillNextIncomeDate(USER_ID, null, END_DATE);
        assertEquals(0, actual);
        verifyNoInteractions(payPeriodStatisticsService);
    }

    @Test
    void test_LoadDaysLeftTillNextIncomeDate_whenEndDateIsNull_thenReturnZero(){
        Integer actual = payPeriodBudgetStatisticsService.loadDaysLeftTillNextIncomeDate(USER_ID, START_DATE, null);
        assertEquals(0, actual);
        verifyNoInteractions(payPeriodStatisticsService);
    }

    @Test
    void test_LoadDaysLeftTillNextIncomeDate_whenQueryReturnsRows_thenReturnDaysLeft() {

    }

    private void stubQuery(List<Object[]> results) {
        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
        when(typedQuery.getResultList()).thenReturn(results);
    }




    @AfterEach
    void tearDown() {
    }
}