package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CategorySpendAmount;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

@SpringBootTest
class CSVTransactionsByCategoryQueriesTest
{
    @MockBean
    private EntityManager entityManager;

    @MockBean
    private CSVTransactionService csvTransactionService;

    @Autowired
    private CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries;

    @BeforeEach
    void setUp() {
        entityManager = Mockito.mock(EntityManager.class);
    }

    @Test
    @DisplayName("Test when query results are null then return an empty collection")
    void testGetTotalMatchedCategorySpending_whenResultsAreNull_thenReturnEmptyCollection(){
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 10, 1);
        LocalDate endDate = LocalDate.of(2025, 10, 31);

        jakarta.persistence.TypedQuery<Object[]> mockQuery =
                Mockito.mock(jakarta.persistence.TypedQuery.class);

        // Mock entityManager.createQuery() to return the mock query
        Mockito.when(entityManager.createQuery(
                        anyString(),
                        ArgumentMatchers.eq(Object[].class)))  // Use eq() matcher, not raw value
                .thenReturn(mockQuery);

        // Mock setParameter() to return the query (for method chaining)
        Mockito.when(mockQuery.setParameter(anyString(), any()))
                .thenReturn(mockQuery);

        // Mock getResultList() to return empty list
        Mockito.when(mockQuery.getResultList())
                .thenReturn(Collections.emptyList());

        List<CategorySpendAmount> actual = csvTransactionsByCategoryQueries.getTotalMatchedCategorySpending(userId,startDate,endDate);
        assertNotNull(actual);
        assertEquals(0,actual.size());
        assertTrue(actual.isEmpty());
    }

    @AfterEach
    void tearDown() {
    }
}