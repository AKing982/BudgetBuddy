package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeBuilderServiceTest
{
    @Mock
    private EnvelopeCalculations envelopeCalculations;

    @Mock
    private LinkedEnvelopesService linkedEnvelopesService;

    @Mock
    private EnvelopeService envelopeService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}