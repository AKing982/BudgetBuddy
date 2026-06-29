package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EnvelopeContributionValidator
{
    private TransactionService transactionService;
    private RecurringTransactionService recurringTransactionService;
    private AccountBalanceHistoryService accountBalanceHistoryService;

    @Autowired
    public EnvelopeContributionValidator(TransactionService transactionService, RecurringTransactionService recurringTransactionService, AccountBalanceHistoryService accountBalanceHistoryService)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
    }

    public void runValidation(EnvelopeNotification envelopeNotification, Contributions contributions, Long envelopeId)
    {

    }

    Boolean validateEnvelopeNotification(EnvelopeNotification envelopeNotification)
    {
        return true;
    }

    Boolean validateContribution(Contributions contributions, Long envelopeId)
    {
        return true;
    }
}
