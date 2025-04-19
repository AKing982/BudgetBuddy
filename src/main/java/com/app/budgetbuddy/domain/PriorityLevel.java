package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum PriorityLevel
{
    USER_DEFINED(100),
    MERCHANT_AMOUNT_CATEGORY(50),
    MERCHANT_CATEGORY(40),
    TRANSACTION_DESCRIPTION_CATEGORY(35),
    MERCHANT_ONLY(30),
    CATEGORY_ID_NAME(25),
    CATEGORY_ID_ONLY(21),
    CATEGORY_NAME_ONLY(20),
    DATA_COMPLETE(15),
    DATA_PARTIAL(10),
    DATA_MINIMAL(5),
    NONE(0);

    private final int value;

    PriorityLevel(final int value){
        this.value = value;
    }

    public static PriorityLevel fromValue(final int value){
        for(PriorityLevel level : PriorityLevel.values()){
            if(level.getValue() == value){
                return level;
            }
        }
        return PriorityLevel.NONE;
    }
}
