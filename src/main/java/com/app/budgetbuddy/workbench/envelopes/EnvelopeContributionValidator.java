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

    @Autowired
    public EnvelopeContributionValidator(TransactionService transactionService, RecurringTransactionService recurringTransactionService, AccountBalanceHistoryService accountBalanceHistoryService)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
    }

    public Optional<ContributionValidationResult> runValidationCheck(final EnvelopeNotification envelopeNotification, final Contributions contributions)
    {
        if(envelopeNotification == null || contributions == null)
        {
            log.warn("Cannot run validation check. Envelope notification or contributions is null.");
            return Optional.empty();
        }
        Long envelopeId = envelopeNotification.getEnvelopeId();
        EnvelopeType envelopeType = envelopeNotification.getEnvelopeType();
        try
        {
            return switch(envelopeType){
                case PAYOFF, PURCHASE -> Optional.of()
            }
        }catch(EnvelopeException e){
            log.error("There was an error running the validation check", e);
            return Optional.empty();
        }
        return null;
    }

    private ContributionValidationResult validateFundedContribution(EnvelopeNotification envelopeNotification,
                                                                    Contributions contributions,
                                                                    Long envelopeId)
    {
        // TODO: this lookup ("which account is linked to this envelope") is currently guessed
        // as living on AccountBalanceHistoryService, which feels like the wrong home for it —
        // more likely this belongs on EnvelopeService or a dedicated account-link service.
        // Wire to wherever the FUND envelope's connected-account relationship actually lives.
        Optional<LinkedAccount> linkedAccount = accountBalanceHistoryService.findLinkedAccountForEnvelope(envelopeId);

        if (linkedAccount.isEmpty())
        {
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                    "No savings/fund account is connected to this envelope. Connect an account to enable automatic verification.");
            throw new EnvelopeException("No linked savings/fund account for envelope " + envelopeId);
        }

        // TODO: confirm method name/signature on AccountBalanceHistoryService — assumed it can
        // check whether the linked account's balance history shows an update this month that
        // matches the contribution amount.
        BigDecimal expectedAmount = BigDecimal.valueOf(contributions.getAmount());
        boolean matches = accountBalanceHistoryService.hasMatchingBalanceUpdateForMonth(
                linkedAccount.get().getAccountId(), expectedAmount, contributions.getScheduledDate());

        if (matches)
        {
            completeContribution(contributions, ContributionProvenance.BALANCE_INFERRED, null);
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.COMPLETED,
                    "Contribution confirmed via a matching account balance update.");
            return new ContributionValidationResult(true, ContributionProvenance.BALANCE_INFERRED, null);
        }
        else
        {
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                    "We couldn't find a matching balance update in your linked account for this month.");
            return new ContributionValidationResult(false, null, null);
        }
    }

    private ContributionValidationResult validateTrackedContribution(EnvelopeNotification envelopeNotification,
                                                                     Contributions contributions,
                                                                     Long envelopeId)
    {
        // TODO: confirm method name/signature on TransactionService — assumed it can look up
        // a transaction matching this envelope's contribution (amount/date/account).
        Optional<TransactionMatch> transactionMatch = transactionService.findMatchingTransaction(envelopeId, contributions);
        if (transactionMatch.isPresent())
        {
            completeContribution(contributions, ContributionProvenance.BANK_VERIFIED, transactionMatch.get().transactionId());
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.COMPLETED,
                    "Contribution confirmed via a matching transaction.");
            return new ContributionValidationResult(true, ContributionProvenance.BANK_VERIFIED, transactionMatch.get().transactionId());
        }

        // TODO: confirm method name/signature on RecurringTransactionService.
        Optional<RecurringTransactionMatch> recurringMatch = recurringTransactionService.findMatchingRecurringTransaction(envelopeId, contributions);
        if (recurringMatch.isPresent())
        {
            completeContribution(contributions, ContributionProvenance.RECURRING_MATCHED, recurringMatch.get().transactionId());
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.COMPLETED,
                    "Contribution confirmed via a recognized recurring transaction.");
            return new ContributionValidationResult(true, ContributionProvenance.RECURRING_MATCHED, recurringMatch.get().transactionId());
        }

        // Neither table has a match — terminate here. Do NOT touch the contribution schedule;
        // it stays SCHEDULED/PENDING_VERIFICATION until something confirms it or it goes stale.
        saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                "We couldn't confirm this contribution against your linked accounts yet.");
        return new ContributionValidationResult(false, null, null);
    }
}
