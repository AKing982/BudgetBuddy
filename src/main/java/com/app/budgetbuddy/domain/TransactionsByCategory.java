package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionsByCategory
{
   private String categoryName;
   private BigDecimal totalCategorySpending;
   private List<Transaction> transactions;

   public TransactionsByCategory(String categoryName, List<Transaction> transactions) {
      this.categoryName = categoryName;
      this.transactions = transactions;
   }

   public TransactionsByCategory(String categoryName, BigDecimal totalCategorySpending, List<Transaction> transactions) {
      this.categoryName = categoryName;
      this.totalCategorySpending = totalCategorySpending;
      this.transactions = transactions;
   }

   public static TransactionsByCategory build(String categoryName, List<Transaction> transactions)
   {
      return new TransactionsByCategory(categoryName, transactions);
   }

   @Override
   public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      TransactionsByCategory that = (TransactionsByCategory) o;
      return Objects.equals(categoryName, that.categoryName) && Objects.equals(transactions, that.transactions);
   }


   @Override
   public int hashCode() {
      return Objects.hash(categoryName, transactions);
   }
}
