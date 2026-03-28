package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplate
{
    private Long id;
    private Long subBudgetId;
    private BPTemplateType templateType;
    private Period period;
    private BPGoalsDetail bpGoalsDetail;
    private BPTemplateDetail bpTemplateDetail;
    private boolean active;
    private boolean isSaved;

    public BPTemplate(Long id, Long subBudgetId, BPTemplateType templateType, Period period, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail, boolean active)
    {
        this.id = id;
        this.subBudgetId = subBudgetId;
        this.templateType = templateType;
        this.period = period;
    }
}
