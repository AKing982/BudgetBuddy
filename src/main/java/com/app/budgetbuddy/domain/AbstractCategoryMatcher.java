package com.app.budgetbuddy.domain;

import lombok.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Setter
@Getter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
public class AbstractCategoryMatcher
{
    private String category;
    private BigDecimal amount;

    
}
