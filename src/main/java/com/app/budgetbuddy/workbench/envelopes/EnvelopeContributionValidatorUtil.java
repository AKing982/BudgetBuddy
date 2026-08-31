package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
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
    private static final BigDecimal DEFAULT_TOLERANCE = BigDecimal.valueOf(2.00);

    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final AccountBalanceHistoryService accountBalanceHistoryService;

    @Autowired
    public EnvelopeContributionValidatorUtil(TransactionService transactionService,
                                             RecurringTransactionService recurringTransactionService,
                                             AccountBalanceHistoryService accountBalanceHistoryService)
    {
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.accountBalanceHistoryService = accountBalanceHistoryService;
    }

    /**
     * PAYOFF / PURCHASE — confirmed only if a discrete transaction or a recognized recurring
     * transaction backs it. No balance-history fallback: a payoff/purchase contribution is
     * "a specific payment happened," not "money is accumulating somewhere," so an account
     * balance moving isn't meaningful evidence the way it is for a fund.
     */
    public ContributionValidationResult validateTrackedContribution(EnvelopeNotification envelopeNotification,
                                                                    Contributions contributions,
                                                                    Long envelopeId)
    {
        // TODO: confirm method name/signature on TransactionService.

        Optional<TransactionMatch> transactionMatch = transactionService.findMatchingTransaction(envelopeId, contributions);
        if(transactionMatch.isPresent())
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

    /**
     * SAVINGS / FUND — requires a linked account. No linked account at all is a configuration
     * error (this envelope shouldn't be in AUTO mode without one), not just an unconfirmed
     * result — so it throws rather than quietly returning false.
     */
    ContributionValidationResult validateFundedContribution(EnvelopeNotification envelopeNotification,
                                                            Contributions contributions,
                                                            Long envelopeId)
    {
        // TODO: still unresolved — "which account is linked to this envelope" isn't on
        // AccountBalanceHistoryService (confirmed, it only takes an accountId it assumes you
        // already have). Needs to come from EnvelopeService or wherever the FUND envelope's
        // connected-account relationship actually lives.
        Optional<LinkedAccount> linkedAccount = resolveLinkedAccount(envelopeId);
        if (linkedAccount.isEmpty())
        {
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                    "No savings/fund account is connected to this envelope. Connect an account to enable automatic verification.");
            throw new EnvelopeException("No linked savings/fund account for envelope " + envelopeId);
        }

        String accountId = linkedAccount.get().getAccountId();
        LocalDate scheduledDate = contributions.getScheduledDate();
        DeltaWindow window = resolveDeltaWindow(scheduledDate);

        // Baseline: last known balance before the contribution was due this period.
        Optional<AccountBalanceHistoryEntity> baseline = accountBalanceHistoryService
                .findByAccountIdAndDateRange(accountId, window.baselineStart(), window.baselineEnd());

        // Latest: most recent balance from the due date through today.
        Optional<AccountBalanceHistoryEntity> latest = accountBalanceHistoryService
                .findByAccountIdAndDateRange(accountId, window.latestStart(), window.latestEnd());

        if (baseline.isEmpty() || latest.isEmpty())
        {
            // Not enough balance history yet — e.g. this is the account's first tracked
            // period, or Plaid hasn't synced a post-due-date snapshot yet.
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                    "Not enough balance history yet to confirm this contribution.");
            return new ContributionValidationResult(false, null, null);
        }

        BigDecimal delta = computeDelta(baseline.get().getBalance(), latest.get().getBalance());
        BigDecimal expectedAmount = BigDecimal.valueOf(contributions.getAmount());

        if (isWithinTolerance(delta, expectedAmount))
        {
            completeContribution(contributions, ContributionProvenance.BALANCE_INFERRED, null);
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.COMPLETED,
                    "Contribution confirmed via a matching account balance increase.");
            return new ContributionValidationResult(true, ContributionProvenance.BALANCE_INFERRED, null);
        }
        else
        {
            saveNotificationHistory(envelopeNotification, EnvelopeStatus.PENDING,
                    "The linked account's balance change didn't match this contribution for this month.");
            return new ContributionValidationResult(false, null, null);
        }
    }

    // ── Pure math — no service dependencies, kept static even though the class isn't ──────────

    record DeltaWindow(LocalDate baselineStart, LocalDate baselineEnd, LocalDate latestStart, LocalDate latestEnd) {}

    /**
     * TODO: "start of billing period" assumes monthly cadence (calendar month start). For
     * weekly/biweekly envelopes this should be "since the previous scheduled contribution"
     * instead — needs the envelope's frequency, which isn't passed in yet.
     */
    private static DeltaWindow resolveDeltaWindow(LocalDate scheduledDate)
    {
        LocalDate periodStart = scheduledDate.withDayOfMonth(1);
        return new DeltaWindow(periodStart, scheduledDate.minusDays(1), scheduledDate, LocalDate.now());
    }

    private static BigDecimal computeDelta(double baselineBalance, double latestBalance)
    {
        return BigDecimal.valueOf(latestBalance - baselineBalance);
    }

    /**
     * Tolerant comparison — balance deltas can be off by a cent or two from bank rounding, and
     * may include interest or other small transactions alongside the intended contribution.
     */
    private static boolean isWithinTolerance(BigDecimal actualDelta, BigDecimal expectedAmount)
    {
        return actualDelta.subtract(expectedAmount).abs().compareTo(DEFAULT_TOLERANCE) <= 0;
    }

}
