package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionRule
{
    private Long id;
    private Long userId;
    private String categoryName;
    private String descriptionRule;
    private String merchantRule;
    private String extendedDescriptionRule;
    private double amountMin;
    private double amountMax;
    private int priority;
    private int matchCount;

    @JsonProperty("isActive")
    private boolean isActive;
    private Timestamp dateCreated;
    private Timestamp dateModified;


}
