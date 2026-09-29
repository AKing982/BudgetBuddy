package com.app.budgetbuddy.workbench.budgetplanner;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BPTemplateRunnerTest {

    @Mock
    private BPTemplateGeneratorService bpTemplateGeneratorService;

    @InjectMocks
    private BPTemplateRunner bpTemplateRunner;

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}