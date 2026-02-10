package com.app.budgetbuddy.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
@ToString
@EqualsAndHashCode
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

    public static PlaidCategory createWithIdAndSecondary(String categoryId, String secondaryCategory)
    {
        return PlaidCategory.builder().categoryId(categoryId).secondaryCategory(secondaryCategory).build();
    }

    public static PlaidCategory createPlaidCategoryWithIdAndPrimary(String categoryId, String primaryCategory)
    {
        return PlaidCategory.builder().categoryId(categoryId).primaryCategory(primaryCategory).build();
    }

    public static PlaidCategory createPlaidCategoryWithPrimaryAndSecondary(String primaryCategory, String secondaryCategory)
    {
        return PlaidCategory.builder().primaryCategory(primaryCategory).secondaryCategory(secondaryCategory).build();
    }
}
