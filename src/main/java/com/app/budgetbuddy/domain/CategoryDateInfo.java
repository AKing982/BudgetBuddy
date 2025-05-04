package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryDateInfo
{
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;

    public static CategoryDateInfo createCategoryDateInfo(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return new CategoryDateInfo(userId, startDate, endDate);
    }
}
