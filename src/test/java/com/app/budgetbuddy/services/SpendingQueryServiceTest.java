package com.app.budgetbuddy.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SpendingQueryServiceTest {

    @InjectMocks
    private SpendingQueryService spendingQueryService;

    @Mock
    private Query query;

    @Mock
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testGetDailySpendingCalculation_whenDateIsNull_thenCreateNewDateAndReturnTotal() {

    }

    @AfterEach
    void tearDown() {
    }
}