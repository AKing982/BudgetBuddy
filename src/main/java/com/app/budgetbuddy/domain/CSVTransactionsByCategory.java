package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@ToString
public class CSVTransactionsByCategory
{
    private String category;
    private BigDecimal totalCategorySpending;
    private List<TransactionCSV> csvTransactions;

    public CSVTransactionsByCategory(String categoryName, List<TransactionCSV> transactions) {
        this.category = categoryName;
        this.csvTransactions = transactions;
    }

    public CSVTransactionsByCategory(String categoryName, BigDecimal totalCategorySpending, List<TransactionCSV> transactions) {
        this.category = categoryName;
        this.totalCategorySpending = totalCategorySpending;
        this.csvTransactions = transactions;
    }

    public static CSVTransactionsByCategory build(String categoryName, List<TransactionCSV> transactions) {
        return new CSVTransactionsByCategory(categoryName, transactions);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CSVTransactionsByCategory that = (CSVTransactionsByCategory) o;
        return Objects.equals(category, that.category) &&
                Objects.equals(csvTransactions, that.csvTransactions);
    }

    @Override
    public int hashCode() {
        return Objects.hash(category, csvTransactions);
    }

}
