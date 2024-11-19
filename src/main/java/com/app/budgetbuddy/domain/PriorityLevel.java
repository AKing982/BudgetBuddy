package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum PriorityLevel
{
    USER_DEFINED(10),
    HIGHEST(4),
    HIGH(3),
    MEDIUM(2),
    LOW(1),
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
