package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;


@Slf4j
@Component
public class EnvelopeContributionValidatorUtil
{
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final AccountBalanceHistoryService accountBalanceHistoryService;
    private final EnvelopeNotificationService envelopeNotificationService;
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionValidatorUtil(TransactionService transactionService,
                                             RecurringTransactionService recurringTransactionService,
                                             AccountBalanceHistoryService accountBalanceHistoryService,
                                             EnvelopeNotificationService envelopeNotificationService,
                                             EnvelopeService envelopeService)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeService = envelopeService;
    }

    /**
     * PAYOFF / PURCHASE — confirmed only if a discrete transaction or a recognized recurring
     * transaction backs it. No balance-history fallback: a payoff/purchase contribution is
     * "a specific payment happened," not "money is accumulating somewhere," so an account
     * balance moving isn't meaningful evidence the way it is for a fund.
     */
    public ContributionValidationResult validateContribution(EnvelopeNotification envelopeNotification,
                                                             Contributions contributions)
    {

        // Check if the contribution made by the user was done by transactions or recurring transactions.
        // In checking the transactions, check if any transactions match by merchant and contribution amount,
        // Check whether there are any transactions that match by merchant and contribution amount on the day the user accepted and within 7 days.
        // if no transactions match, check if there are any recurring transactions that match by merchant and contribution amount and within 7 days.
        Long envelopeId = envelopeNotification.getEnvelopeId();
        Envelope envelope = envelopeService.findByEnvelopeId(envelopeId)
                .orElseThrow(() -> new EnvelopeException("Envelope not found for id: " + envelopeId));
        String merchant = contributions.getMerchant();
        BigDecimal amount = BigDecimal.valueOf(contributions.getAmount());
        LocalDate scheduledDate = contributions.getScheduledDate();
        LocalDate contributionDate = contributions.getContributionDate();
        EnvelopeType envelopeType = envelopeNotification.getEnvelopeType();
        EnvelopeNotification updatedNotification = new EnvelopeNotification();
        updatedNotification.setEnvelopeId(envelopeId);
        updatedNotification.setDateToContribute(scheduledDate);
        updatedNotification.setAmount(amount);
        updatedNotification.setEnvelopeName(envelope.getEnvelopeName());
        updatedNotification.setTitle("Contribution Notification");
        updatedNotification.setRead(false);
        updatedNotification.setEnvelopeType(envelopeType);
        switch(envelopeType)
        {
            case PURCHASE:
            case PAYOFF:
                Optional<Transaction> transactionOptional = transactionService.findTransactionByContributionCriteria(merchant, amount, contributionDate, scheduledDate);
                if(transactionOptional.isPresent())
                {
                    Transaction transaction = transactionOptional.get();
                    String transactionId = transaction.getTransactionId();
                    // Build the updated notification
                    final String message = "Contribution of $" + amount + " for " + merchant + " was made on " + contributionDate + " and is linked to transaction id: " + transactionId;
                    updatedNotification.setMessage(message);
                    // Persist the updated Notification
                    envelopeNotificationService.createAndSave(updatedNotification);
                    // Update the Envelope Status to PAID
                    envelope.setEnvelopeStatus(EnvelopeStatus.PAID);
                    envelopeService.save(envelope);
                    return ContributionValidationResult.builder()
                            .isValidated(true)
                            .matchedTransactionId(transactionId)
                            .contributionProvenance(ContributionProvenance.TRANSACTION_VERIFIED)
                            .build();
                }
                else
                {
                    Optional<RecurringTransaction> recurringTransactionOptional = recurringTransactionService.findRecurringTransactionByContributionCriteria(merchant, amount, contributionDate, scheduledDate);
                    if(recurringTransactionOptional.isPresent())
                    {
                        RecurringTransaction recurringTransaction = recurringTransactionOptional.get();
                        String recurringTransactionId = recurringTransaction.getTransactionId();
                        // Build the updated notification
                        final String message = "Contribution of $" + amount + " for " + merchant + " was made on " + contributionDate + " and is linked to recurring transaction id: " + recurringTransactionId;
                        updatedNotification.setMessage(message);
                        // Persist the updated Notification
                        envelopeNotificationService.createAndSave(updatedNotification);
                        // Update the Envelope Status to PAID
                        envelope.setEnvelopeStatus(EnvelopeStatus.PAID);
                        envelopeService.save(envelope);
                        return ContributionValidationResult.builder()
                                .isValidated(true)
                                .matchedTransactionId(recurringTransactionId)
                                .contributionProvenance(ContributionProvenance.RECURRING_MATCHED)
                                .build();
                    }
                }
                break;
            case FUND:

                // Fund/Savings accounts will require a separate linked account to validate contributions.
                String linkedAccountId = envelope.getLinked_account_id();
                if(linkedAccountId.isEmpty())
                {
                    return ContributionValidationResult.builder()
                            .isValidated(false)
                            .errorMessage("No Linked Account was found for envelope id: " + envelope.getId() + " terminating validation.")
                            .build();

                }
                //TODO: This is a temporary solution for validating a connected savings/fund account. The general algorithm for this type of account will vary on institutions.
                Optional<AccountBalanceHistoryEntity> accountBalanceHistoryOptional = accountBalanceHistoryService.findByAccountId(linkedAccountId);
                if(accountBalanceHistoryOptional.isPresent())
                {
                    AccountBalanceHistoryEntity accountBalanceHistoryEntity = accountBalanceHistoryOptional.get();
                    String accountId = accountBalanceHistoryEntity.getAccount().getId();
                    String description = accountBalanceHistoryEntity.getDescription();
                    BigDecimal balance = BigDecimal.valueOf(accountBalanceHistoryEntity.getBalance());
                    if(description.contains(merchant) && balance.equals(amount))
                    {
                        return ContributionValidationResult.builder()
                                .isValidated(true)
                                .contributionProvenance(ContributionProvenance.BALANCE_INFERRED)
                                .matchedAccountId(accountId)
                                .build();
                    }
                }
                break;
            default:
                throw new EnvelopeException("Invalid Envelope Type: " + envelopeType);
        }
        return ContributionValidationResult.builder()
                .isValidated(false)
                .build();
    }
}
