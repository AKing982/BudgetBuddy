package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.domain.BPTemplateType;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;

import java.util.List;

public interface BPTemplateDetailBuilderService
{
    BPTemplateDetail buildDetail(BPTemplateType bpTemplateType, List<SubBudget> subBudgets);
    BPTemplateDetail saveDetail(BPTemplateDetail detail);
}
