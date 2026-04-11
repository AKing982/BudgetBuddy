package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.domain.BPTemplateType;
import com.app.budgetbuddy.domain.SubBudget;

public interface BPTemplateDetailBuilderService
{
    BPTemplateDetail buildDetail(BPTemplateType bpTemplateType, SubBudget subBudget);
    BPTemplateDetail saveDetail(BPTemplateDetail detail);
}
