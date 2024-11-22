package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionMatchType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;


@ExtendWith(MockitoExtension.class)
class TransactionPatternBuilderTest {

    @InjectMocks
    private TransactionPatternBuilder transactionPatternBuilder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }





    @AfterEach
    void tearDown() {
    }
}