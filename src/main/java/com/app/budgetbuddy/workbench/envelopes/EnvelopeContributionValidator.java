package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopeContributionValidator
{
    private TransactionService transactionService;
    private RecurringTransactionService recurringTransactionService;
    private AccountBalanceHistoryService accountBalanceHistoryService;
    private final EnvelopeContributionValidatorUtil envelopeContributionValidatorUtil;

    @Autowired
    public EnvelopeContributionValidator(TransactionService transactionService, RecurringTransactionService recurringTransactionService, AccountBalanceHistoryService accountBalanceHistoryService,
                                         EnvelopeContributionValidatorUtil envelopeContributionValidatorUtil)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
        this.envelopeContributionValidatorUtil = envelopeContributionValidatorUtil;
    }

    public Optional<ContributionValidationResult> runValidationCheck(final EnvelopeNotification envelopeNotification, final Contributions contributions)
    {
        if(envelopeNotification == null || contributions == null)
        {
            log.warn("Cannot run validation check. Envelope notification or contributions is null.");
            return Optional.empty();
        }
        try
        {
            return Optional.of(envelopeContributionValidatorUtil.validateContribution(envelopeNotification, contributions));
        }catch(EnvelopeException e){
            log.error("There was an error running the validation check", e);
            return Optional.empty();
        }
    }
}
