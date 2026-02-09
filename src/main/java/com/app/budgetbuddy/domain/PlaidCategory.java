package com.app.budgetbuddy.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class PlaidCategory
{
    private String categoryId;
    private String primaryCategory;
    private String secondaryCategory;

    public PlaidCategory(String categoryId, String primaryCategory, String secondaryCategory) {
        this.categoryId = categoryId;
        this.primaryCategory = primaryCategory;
        this.secondaryCategory = secondaryCategory;
    }
}
