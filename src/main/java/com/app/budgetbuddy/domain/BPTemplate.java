package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BPTemplate
{
    private Long id;
    private Long subBudgetId;
    private String templateName;
    private boolean isFiftyThirtyTwentyRule;
    private BPTemplateType templateType;
    private List<BPWeekDetail> weekDetails = new ArrayList<>();
    private boolean active;

    public BPTemplate(Long id, Long subBudgetId, String templateName, boolean isFiftyThirtyTwentyRule, BPTemplateType templateType, List<BPWeekDetail> weekDetails, boolean active) {
        this.id = id;
        this.subBudgetId = subBudgetId;
        this.templateName = templateName;
        this.isFiftyThirtyTwentyRule = isFiftyThirtyTwentyRule;
        this.templateType = templateType;
        this.weekDetails = weekDetails;
        this.active = active;
    }
}
