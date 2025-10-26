package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class PlaidBooleanSync
{
    private Long userId;
    private Boolean synced;
    private int totalSyncedTransactions;
    private int totalModified;
    private LocalDate lastSyncDate;
    private LocalDateTime lastSyncTime;
    private List<Transaction> transactions = new ArrayList<>();
    private List<RecurringTransaction> recurringTransactions = new ArrayList<>();

    public PlaidBooleanSync(Long userId, Boolean synced, int totalSyncedTransactions, int totalModified, LocalDate lastSyncDate, LocalDateTime lastSyncTime) {
        this.userId = userId;
        this.synced = synced;
        this.totalSyncedTransactions = totalSyncedTransactions;
        this.totalModified = totalModified;
        this.lastSyncDate = lastSyncDate;
        this.lastSyncTime = lastSyncTime;
    }

}
