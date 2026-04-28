package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.services.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BPTemplateGeneratorServiceTest
{
    @Mock
    private BPTemplateService bpTemplateService;

    @Mock
    private BPTemplateDetailsService bpTemplateDetailsService;

    @Mock
    private BPTemplateBuilderService bpTemplateBuilderService;

    @Mock
    private BPColumnService bpColumnService;

    @Mock
    private BPCategoryService bpcategoryService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @InjectMocks
    private BPTemplateGeneratorService bpTemplateGeneratorService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testResyncTemplate_whenTemplateIdIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> bpTemplateGeneratorService.resyncTemplate(null, 1L));
    }

    @Test
    void testResyncTemplate_whenTemplateIdValid_thenReturnSyncedTemplate(){

    }

    @AfterEach
    void tearDown() {
    }
}