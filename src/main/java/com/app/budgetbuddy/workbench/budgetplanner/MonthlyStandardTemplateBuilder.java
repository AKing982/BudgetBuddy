package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class MonthlyStandardTemplateBuilder implements BPTemplateBuilderService
{
    private final BPTemplateService templateService;
    private final BPTemplateDetailBuilderService templateDetailBuilderService;

    @Autowired
    public MonthlyStandardTemplateBuilder(BPTemplateService bpTemplateService,
                                          @Qualifier("monthlyTemplateBuilder") BPTemplateDetailBuilderService templateDetailBuilderService)
    {
        this.templateService = bpTemplateService;
        this.templateDetailBuilderService = templateDetailBuilderService;
    }

    @Override
    public BPTemplate buildInitialTemplate(BPTemplateType templateType, Period period, Long subBudgetId)
    {
        return null;
    }

    @Override
    public BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail)
    {
        return null;
    }

    @Override
    public BPTemplate saveTemplate(BPTemplate template)
    {
        return null;
    }
}
