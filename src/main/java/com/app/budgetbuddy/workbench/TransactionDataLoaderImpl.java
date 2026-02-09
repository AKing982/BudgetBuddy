package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionDataLoaderImpl {

    private final TransactionService transactionService;

    @Autowired
    public TransactionDataLoaderImpl(final TransactionService transactionService)
    {
        this.transactionService = transactionService;
    }

}
