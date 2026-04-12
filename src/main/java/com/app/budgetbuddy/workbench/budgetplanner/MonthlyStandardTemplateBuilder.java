package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import com.app.budgetbuddy.services.BPTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MonthlyStandardTemplateBuilder implements BPTemplateBuilderService
{
    private final BPTemplateDetailsService templateService;
    private final BPTemplateDetailBuilderService templateDetailBuilderService;

    @Autowired
    public MonthlyStandardTemplateBuilder(BPTemplateDetailsService bpTemplateDetailsService,
                                          BPTemplateDetailBuilderService templateDetailBuilderService)
    {
        this.templateService = bpTemplateDetailsService;
        this.templateDetailBuilderService = templateDetailBuilderService;
    }

    @Override
    public BPTemplate buildInitialTemplate(BPTemplateType templateType, Period period, boolean requireCategoryHeaders, List<String> categoryHeaders, BPIncomeCriteria incomeCriteria, List<SubBudget> subBudgets)
    {
        BPTemplateDetail detail = templateDetailBuilderService.buildDetail(templateType, incomeCriteria, requireCategoryHeaders, categoryHeaders, subBudgets);
        saveTemplateDetail(detail);
        BPTemplate template = new BPTemplate();
        template.setTemplateType(templateType);
        template.setPeriod(period);
        template.setBpTemplateDetail(detail);
        template.setActive(true);
        template.setSaved(false);
        return template;
    }

    private void saveTemplateDetail(BPTemplateDetail detail)
    {
        templateService.saveModel(detail);
    }

    @Override
    public BPTemplate buildTemplate(BPTemplate firstTemplate, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail)
    {
        if(firstTemplate == null)
        {
            throw new DataException("Template cannot be null");
        }
        firstTemplate.setBpGoalsDetail(bpGoalsDetail);
        firstTemplate.setBpTemplateDetail(bpTemplateDetail);
        return firstTemplate;
    }

}
