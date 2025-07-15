package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPGoalsDetail;
import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.domain.BPTemplateDetail;

public interface BPTemplateBuilderService
{
    BPTemplate buildInitialTemplate(String templateType);
    BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail);
}
