package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPGoalsDetail;
import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.domain.BPTemplateDetail;
import org.springframework.stereotype.Service;

@Service
public class MonthlyStandardTemplateBuilder implements BPTemplateBuilderService
{

    @Override
    public BPTemplate buildInitialTemplate(String templateType)
    {
        return null;
    }

    @Override
    public BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail)
    {
        return null;
    }
}
