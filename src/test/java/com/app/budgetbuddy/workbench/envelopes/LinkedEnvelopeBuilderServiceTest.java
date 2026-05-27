package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.BudgetCriteria;
import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.domain.NewEnvelopeCriteria;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class LinkedEnvelopeBuilderTest {

    @Mock
    private LinkedEnvelopesService linkedEnvelopesService;

    @InjectMocks
    private LinkedEnvelopeBuilder linkedEnvelopeBuilderService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testBuild_whenCriteriaIsNull_thenThrowEnvelopeException(){
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        Optional<EnvelopeLink> actual = linkedEnvelopeBuilderService.build(null, budgetCriteria);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuild_whenCriteriaIsEmpty_thenReturnEmptyOptional()
    {
        List<NewEnvelopeCriteria> criteria = List.of();
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        Optional<EnvelopeLink> actual = linkedEnvelopeBuilderService.build(criteria, budgetCriteria);
        assertTrue(actual.isEmpty());
    }

    @AfterEach
    void tearDown() {
    }
}