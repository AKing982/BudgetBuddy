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
    private String templateName;
    private BPTemplateType templateType;
    private List<BPTemplateHeader> bpTemplateHeader;
    private BPGoalsDetail bpGoalsDetail;
    private BPTemplateDetail bpTemplateDetail;
    private boolean active;

    public BPTemplate(Long id, Long subBudgetId, String templateName, BPTemplateType templateType, BPTemplateHeader bpTemplateHeader, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail, boolean active)
    {
        this.id = id;
        this.subBudgetId = subBudgetId;
        this.templateName = templateName;
        this.templateType = templateType;
    }


}
