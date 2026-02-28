package com.app.budgetbuddy.domain;

import java.util.List;

public record HistoricalTransactionsByCategories(List<TransactionsByCategory> historicalTransactions, int numberOfMonths) {
}
