package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class EnvelopeNotificationBuilder
{
    private final EnvelopeNotificationService envelopeNotificationService;
    private final AccountBalanceHistoryService accountBalanceHistoryService;
    private final TransactionRepository transactionRepository;
    private final RecurringTransactionsRepository recurringTransactionsRepository;

    @Autowired
    public EnvelopeNotificationBuilder(EnvelopeNotificationService envelopeNotificationService,
                                       AccountBalanceHistoryService accountBalanceHistoryService,
                                       TransactionRepository transactionRepository,
                                       RecurringTransactionsRepository recurringTransactionsRepository)
    {
        this.envelopeNotificationService = envelopeNotificationService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
        this.transactionRepository = transactionRepository;
        this.recurringTransactionsRepository = recurringTransactionsRepository;
    }

    public Optional<EnvelopeNotification> createEnvelopeNotification(final Envelope envelope, final List<Contributions> contributions)
    {
        if(envelope == null || contributions == null || contributions.isEmpty())
        {
            return Optional.empty();
        }
        EnvelopeType envelopeType = envelope.getEnvelopeType();
        Long envelopeId = envelope.getId();
        Long userId = envelope.getUserId();
        String envelopeName = envelope.getEnvelopeName();
        EnvelopeNotification envelopeNotification = new EnvelopeNotification();
        for(Contributions contribution: contributions)
        {
            double contributionAmount = contribution.getAmount();
            LocalDate contributionDate = contribution.getContributionDate();
            LocalDate scheduledDate = contribution.getScheduledDate();
            String merchant = contribution.getMerchant();
            EnvelopeStatus status = !contributionDate.isAfter(scheduledDate) ? EnvelopeStatus.PAID : EnvelopeStatus.LATE;
            switch(envelopeType){
                case PURCHASE:
                    envelopeNotification.setAmount(BigDecimal.valueOf(contributionAmount));
                    envelopeNotification.setDateToContribute(scheduledDate);
                    envelopeNotification.setRead(false);
                    boolean matchingTransactions = transactionRepository.checkTransactionsByMerchantAndPostedDateAndAmountExists(merchant, userId, contributionDate, BigDecimal.valueOf(contributionAmount));
                    if(matchingTransactions)
                    {

                        envelopeNotification.setEnvelopeStatus(status);
                        envelopeNotification.setTitle("Contribution Paid");
                        envelopeNotification.setMessage("Your contribution of $" + contributionAmount + " for " + envelopeName + " has been verified successfully");
                    }
                    else
                    {
                        envelopeNotification.setEnvelopeStatus(EnvelopeStatus.PENDING);
                        envelopeNotification.setTitle("Contribution Pending");
                        envelopeNotification.setMessage("Your contribution of $" + contributionAmount + " for " + envelopeName + " is pending verification");
                    }
                    break;
                case PAYOFF:
                    envelopeNotification.setAmount(BigDecimal.valueOf(contributionAmount));
                    envelopeNotification.setDateToContribute(scheduledDate);
                    envelopeNotification.setRead(false);
                    boolean matchingRecurring = recurringTransactionsRepository.checkForRecurringTransactionCountOnDate(userId, BigDecimal.valueOf(contributionAmount), contributionDate);
                    if(matchingRecurring)
                    {
                        envelopeNotification.setEnvelopeStatus(status);
                        envelopeNotification.setTitle("Contribution verified");
                        envelopeNotification.setMessage("Your payment of $" + contributionAmount + " for " + envelopeName + " has been verified successfully");
                    }
                    else
                    {
                        envelopeNotification.setEnvelopeStatus(EnvelopeStatus.PENDING);
                        envelopeNotification.setTitle("Contribution Pending");
                        envelopeNotification.setMessage("We could not find a matching recurring transaction for the contribution. Please check the transaction details and try again.");
                    }
                    break;
                case FUND:
                    String linked_account_id = envelope.getLinked_account_id();
                    envelopeNotification.setAmount(BigDecimal.valueOf(contributionAmount));
                    envelopeNotification.setDateToContribute(scheduledDate);
                    envelopeNotification.setRead(false);
                    Optional<AccountBalanceHistoryEntity> balanceHistoryOptional = accountBalanceHistoryService.findByAccountIdAndDateRange(linked_account_id, contributionDate, scheduledDate);
                    if(balanceHistoryOptional.isPresent())
                    {
                        AccountBalanceHistoryEntity accountBalanceHistoryEntity = balanceHistoryOptional.get();
                        double balance = accountBalanceHistoryEntity.getBalance();
                        if(balance == contributionAmount)
                        {
                            envelopeNotification.setEnvelopeStatus(EnvelopeStatus.SUBMITTED);
                            envelopeNotification.setTitle("Contribution Submitted");
                            envelopeNotification.setMessage("Your contribution of $" + contributionAmount + " for " + envelopeName + " has been submitted successfully");
                        }
                    }
                    break;
            }
        }
//        // If the contribution was made, then the envelope status should change to Pending, and will be updated once verification of the actual contribution.
//        // The pending state will be updated to Paid for Purchase and Payoff envelopes, Submitted for a Fund Envelope, and Completed if the envelopes target amount has been reached for Purchase and Payoff envelopes.
//        // The verification will be done by either checking the transactions table/recurring transactions table for the corresponding transaction and if found, the state of the envelope will be updated for Purchase and Payoff Envelopes.
//        // Verification for Fund envelopes will be done by checking the user's savings account balance history for the corresponding contribution amount
//        // If the verification was unsuccessful, then the status should be set to Failed.
        envelopeNotification.setEnvelopeId(envelopeId);
        envelopeNotification.setEnvelopeName(envelopeName);
        envelopeNotification.setEnvelopeType(envelopeType);

        envelopeNotificationService.createAndSave(envelopeNotification);

        return Optional.of(envelopeNotification);
    }

    public Optional<EnvelopeLinkNotification> createLinkedEnvelopeNotifications(final EnvelopeLink envelopeLink)
    {
        if(envelopeLink == null)
        {
            return Optional.empty();
        }
        List<EnvelopeNotification> notifications = new ArrayList<>();
        List<EnvelopeContribution> envelopeContributions = envelopeLink.getEnvelopes();
        for(EnvelopeContribution envelopeContribution: envelopeContributions)
        {
            Envelope envelope = envelopeContribution.getEnvelope();
            List<Contributions> contributions = envelopeContribution.getContributions();
            Optional<EnvelopeNotification> envelopeNotificationOptional = createEnvelopeNotification(envelope, contributions);
            envelopeNotificationOptional.ifPresent(notifications::add);
        }
        if(notifications.isEmpty())
        {
            return Optional.empty();
        }
        envelopeNotificationService.createAndSave(notifications);
        return Optional.of(new EnvelopeLinkNotification(envelopeLink, notifications));
    }
}
