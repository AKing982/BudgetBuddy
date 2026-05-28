package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionHistoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class EnvelopeContributionEngineTest
{
    @Mock
    private EnvelopeContributionHistoryService envelopeContributionService;

    @Mock
    private SingleEnvelopeContributionEngine singleEnvelopeContributionService;

    @Mock
    private LinkedEnvelopeContributionEngine linkedEnvelopeContributionService;

    @Mock
    private EnvelopeNotificationBuilder envelopeNotificationService;

    @InjectMocks
    private EnvelopeContributionEngine envelopeContributionEngine;

    @BeforeEach
    void setUp() {
    }


    @AfterEach
    void tearDown() {
    }
}