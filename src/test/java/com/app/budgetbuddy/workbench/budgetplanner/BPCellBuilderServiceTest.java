package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.services.BPCellService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BPCellBuilderServiceTest {

    @Mock
    private BPCellService bpCellService;

    @InjectMocks
    private BPCellBuilderService monthlyBPCellBuilderService;

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}