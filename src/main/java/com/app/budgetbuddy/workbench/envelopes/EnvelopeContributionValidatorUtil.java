package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
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
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionValidatorUtil(TransactionService transactionService,
                                             RecurringTransactionService recurringTransactionService,
                                             AccountBalanceHistoryService accountBalanceHistoryService,
                                             EnvelopeService envelopeService)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
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
        String merchant = contributions.getMerchant();
        BigDecimal amount = BigDecimal.valueOf(contributions.getAmount());
        LocalDate scheduledDate = contributions.getScheduledDate();
        LocalDate contributionDate = contributions.getContributionDate();
        EnvelopeType envelopeType = envelopeNotification.getEnvelopeType();
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

                    // Persist the updated Notification

                    // Update the Envelope Status to PAID

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

                        // Persist the updated Notification

                        // Update the Envelope Status to PAID

                        return ContributionValidationResult.builder()
                                .isValidated(true)
                                .matchedTransactionId(recurringTransactionId)
                                .contributionProvenance(ContributionProvenance.RECURRING_MATCHED)
                                .build();
                    }

                    // If no recurring transaction was found, then default to a contribution validation result that mentions the contribution was not able to be
                    // verified and will create an updated notification to alert the user.
                    // update the envelope status to LATE
                }
                break;
            case FUND:

                // Fund/Savings accounts will require a separate linked account to validate contributions.
                Envelope envelope = envelopeService.findByEnvelopeId(envelopeId)
                        .orElseThrow(() -> new EnvelopeException("Envelope not found for id: " + envelopeId));
                String linkedAccountId = envelope.getLinked_account_id();
                if(linkedAccountId.isEmpty())
                {
                    return ContributionValidationResult.builder()
                            .isValidated(false)
                            .errorMessage("No Linked Account was found for envelope id: " + envelope.getId() + " terminating validation.")
                            .build();

                }

                // 1. First use the envelopeId and check if there is a linked account to the envelope.
                // If there is no linked account tied to the envelope, then return a ContributionValidationResult
                // with a status of no linked account.
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


                // 2. If a linked account exists for the envelope, then check data on the account and validate whether there
                // are any recent balance changes that match the contribution amount. If there are no recent balance changes,
                // then return a ContributionValidationResult with a status of no recent balance changes.

                // 3. No Fallbacks for fund/savings envelopes.
                break;
            default:
                throw new EnvelopeException("Invalid Envelope Type: " + envelopeType);
        }

        return null;
    }
}
