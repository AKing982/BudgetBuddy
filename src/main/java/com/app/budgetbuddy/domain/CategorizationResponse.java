package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorizationResponse
{
    private List<TransactionCategory> regularTransactions;
    private List<TransactionCategory> recurringTransactions;
    private Map<String, Integer> regularTransactionStats;
    private Map<String, Integer> recurringTransactionStats;
    private Integer userRuleCount;
    private Integer systemRuleCount;
    private Integer totalTransactionsProcessed;
    private DateRange dateRange;
    private Long userId;
    private LocalDateTime processedAt;
    private Boolean customRulesApplied;
    private String error;
}