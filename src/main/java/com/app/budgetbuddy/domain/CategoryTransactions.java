package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryTransactions
{
   private String categoryId;
   private String categoryName;
   private List<Transaction> transactions;

   public CategoryTransactions(String categoryId, String categoryName) {
      this.categoryId = categoryId;
      this.categoryName = categoryName;
      this.transactions = new ArrayList<>();
   }

   public CategoryTransactions(String categoryName, List<Transaction> transactions) {
      this.categoryName = categoryName;
      this.transactions = transactions;
   }

   public CategoryTransactions(String categoryId, String categoryName, List<Transaction> transactions) {
      this.categoryId = categoryId;
      this.categoryName = categoryName;
      this.transactions = transactions;
   }

   public static CategoryTransactions build(String categoryName, List<Transaction> transactions)
   {
      return new CategoryTransactions(categoryName, transactions);
   }

   @Override
   public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      CategoryTransactions that = (CategoryTransactions) o;
      return Objects.equals(categoryId, that.categoryId) && Objects.equals(categoryName, that.categoryName) && Objects.equals(transactions, that.transactions);
   }


   @Override
   public int hashCode() {
      return Objects.hash(categoryId, categoryName, transactions);
   }
}
