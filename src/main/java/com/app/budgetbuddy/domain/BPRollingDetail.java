package com.app.budgetbuddy.domain;

import lombok.*;

import java.awt.*;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Deprecated
public class BPRollingDetail
{
    private BPLayoutGrid layoutGrid;
    private BPGoalsDetail goalsDetail;
    private boolean isClassic;
    private boolean isGrouped;
}
