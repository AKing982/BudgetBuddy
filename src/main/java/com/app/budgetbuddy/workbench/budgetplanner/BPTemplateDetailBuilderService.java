package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.domain.BPTemplateType;

public interface BPTemplateDetailBuilderService
{
    BPTemplateDetail buildDetail(BPTemplateType bpTemplateType);
    BPTemplateDetail saveDetail(BPTemplateDetail detail);
}
