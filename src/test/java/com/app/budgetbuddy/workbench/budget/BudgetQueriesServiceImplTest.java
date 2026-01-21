//package com.app.budgetbuddy.workbench.budget;
//
//import com.app.budgetbuddy.domain.BudgetCategory;
//import com.app.budgetbuddy.domain.Category;
//import com.app.budgetbuddy.repositories.BudgetRepository;
//import jakarta.persistence.EntityManager;
//import jakarta.persistence.Query;
//import jakarta.persistence.TypedQuery;
//import org.junit.jupiter.api.AfterEach;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.junit.runner.RunWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.test.context.junit4.SpringRunner;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.util.Collections;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.when;
//
//@ExtendWith(MockitoExtension.class)
//class BudgetQueriesServiceImplTest {
//
//    @Mock
//    private EntityManager entityManager;
//
//    @Mock
//    private BudgetRepository budgetRepository;
//
//    @Mock
//    private TypedQuery<Object[]> typedQuery;
//
//    @Mock
//    private Query query;
//
//    @InjectMocks
//    private BudgetQueriesServiceImpl budgetQueriesService;
//
//    private LocalDate startDate;
//    private LocalDate endDate;
//    private Long budgetId;
//    private Long userId;
//
//
//    @BeforeEach
//    void setUp() {
//        startDate = LocalDate.of(2024, 10, 1);
//        endDate = LocalDate.of(2024, 10, 31);
//        budgetId = 1L;
//        userId = 1L;
//
//        budgetQueriesService = new BudgetQueriesServiceImpl(entityManager, budgetRepository);
//    }
//
//    @Test
//    void getTopExpenseBudgetCategories_Success() {
//        // Arrange
//        Object[] mockRow = new Object[]{
//                "Groceries",
//                new BigDecimal("500.00"),
//                new BigDecimal("450.00"),
//                startDate,
//                endDate
//        };
//        List<Object[]> mockResults = Collections.singletonList(mockRow);
//
//        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
//        when(typedQuery.setMaxResults(anyInt())).thenReturn(typedQuery);
//        when(typedQuery.getResultList()).thenReturn(mockResults);
//
//        // Act
//        List<Category> result = budgetQueriesService.getTopExpenseBudgetCategories(budgetId, startDate, endDate);
//
//        // Assert
//        assertFalse(result.isEmpty());
//        Category category = result.get(0);
//        assertEquals("Groceries", category.getCategoryName());
//        assertEquals(new BigDecimal("500.00"), category.getBudgetedAmount());
//        assertEquals(new BigDecimal("450.00"), category.getActual());
//    }
//
//    @Test
//    void getIncomeBudgetCategory_Success() {
//        // Arrange
//        Object[] mockRow = new Object[]{
//                "Payroll",
//                new BigDecimal("5000.00"),
//                new BigDecimal("5000.00"),
//                startDate,
//                endDate
//        };
//        List<Object[]> mockResults = Collections.singletonList(mockRow);
//
//        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
//        when(typedQuery.getResultList()).thenReturn(mockResults);
//
//        // Act
//        List<Category> result = budgetQueriesService.getIncomeBudgetCategory(userId, startDate, endDate);
//
//        // Assert
//        assertFalse(result.isEmpty());
//        Category category = result.get(0);
//        assertEquals("Payroll", category.getCategoryName());
//        assertEquals(new BigDecimal("5000.00"), category.getBudgetedAmount());
//        assertEquals(new BigDecimal("5000.00"), category.getActual());
//    }
//
//    @Test
//    void getSavingsBudgetCategory_Success() {
//        // Arrange
//        Object[] mockRow = new Object[]{
//                new BigDecimal("1000.00"),
//                new BigDecimal("800.00"),
//                new BigDecimal("200.00"),
//                startDate,
//                endDate
//        };
//        List<Object[]> mockResults = Collections.singletonList(mockRow);
//
//        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
//        when(typedQuery.getResultList()).thenReturn(mockResults);
//
//        // Act
//        List<Category> result = budgetQueriesService.getSavingsBudgetCategory(budgetId, startDate, endDate);
//
//        // Assert
//        assertFalse(result.isEmpty());
//        Category category = result.get(0);
//        assertEquals("Savings", category.getCategoryName());
//        assertEquals(new BigDecimal("1000.00"), category.getBudgetedAmount());
//        assertEquals(new BigDecimal("800.00"), category.getActual());
//    }
//
//    @Test
//    void getTotalBudgeted_Success() {
//        // Arrange
//        BigDecimal expectedAmount = new BigDecimal("2000.00");
//        when(budgetRepository.findBudgetAmountByPeriod(userId, startDate, endDate, budgetId))
//                .thenReturn(expectedAmount);
//
//        // Act
//        BigDecimal result = budgetQueriesService.getTotalBudgeted(budgetId, userId, startDate, endDate);
//
//        // Assert
//        assertEquals(expectedAmount, result);
//    }
//
//    @Test
//    void getRemainingOnBudget_Success() {
//        // Arrange
//        BigDecimal expectedAmount = new BigDecimal("500.00");
//        when(entityManager.createQuery(anyString())).thenReturn(query);
//        when(query.setParameter(anyString(), any())).thenReturn(query);
//        when(query.getSingleResult()).thenReturn(expectedAmount);
//
//        // Act
//        BigDecimal result = budgetQueriesService.getRemainingOnBudget(budgetId, startDate, endDate);
//
//        // Assert
//        assertEquals(expectedAmount, result);
//    }
//
//    @Test
//    void getTotalSpentOnBudget_Success() {
//        // Arrange
//        BigDecimal expectedAmount = new BigDecimal("1500.00");
//        when(entityManager.createQuery(anyString())).thenReturn(query);
//        when(query.setParameter(anyString(), any())).thenReturn(query);
//        when(query.getSingleResult()).thenReturn(expectedAmount);
//
//        // Act
//        BigDecimal result = budgetQueriesService.getTotalSpentOnBudget(budgetId, startDate, endDate);
//
//        // Assert
//        assertEquals(expectedAmount, result);
//    }
//
//
//    @AfterEach
//    void tearDown() {
//    }
//}