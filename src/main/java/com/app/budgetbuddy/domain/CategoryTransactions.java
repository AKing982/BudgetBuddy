package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@ToString
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
