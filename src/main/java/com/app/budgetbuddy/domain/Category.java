package com.app.budgetbuddy.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class Category
{
    private Long categoryId;
    private String categoryName;
    private String categorizedBy;
    private LocalDate categorizedDate;

    public static Category createCategory(Long categoryId, String categoryName, String categorizedBy, LocalDate categorizedDate)
    {
        return Category.builder()
                .categorizedBy(categorizedBy)
                .categoryId(categoryId)
                .categorizedDate(categorizedDate)
                .categoryName(categoryName)
                .build();
    }

    public static Category createUncategorized(){
        return Category.builder()
                .categoryId(0L)
                .categoryName("Uncategorized")
                .categorizedDate(LocalDate.now())
                .categorizedBy("SYSTEM")
                .build();
    }


}
