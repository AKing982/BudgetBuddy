package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.domain.BPTemplateDetail;

import java.util.List;

public interface BPTemplateBuilderService
{
    BPTemplate buildInitialTemplate(String templateType);
    BPTemplate buildTemplate(BPTemplate firstTemplate, List<BPTemplateDetail> bpTemplateDetails);
}
