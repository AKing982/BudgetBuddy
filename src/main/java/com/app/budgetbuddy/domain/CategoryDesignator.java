package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
public class CategoryDesignator
{
   private String categoryId;
   private String categoryName;
   private List<Transaction> transactions;

   public CategoryDesignator(String categoryId, String categoryName) {
      this.categoryId = categoryId;
      this.categoryName = categoryName;
      this.transactions = new ArrayList<>();
   }
}
