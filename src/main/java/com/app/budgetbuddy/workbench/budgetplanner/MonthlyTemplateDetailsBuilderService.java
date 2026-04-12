package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@Service
public class MonthlyTemplateDetailsBuilderService implements BPTemplateDetailBuilderService
{
    private final BPLayoutGeneratorService layoutGeneratorService;
    private final BPGoalsDetailBuilderService bpGoalsDetailBuilderService;
    private final BPTemplateDetailsService bpTemplateDetailsService;

    @Autowired
    public MonthlyTemplateDetailsBuilderService(BPLayoutGeneratorService layoutBuilderService,
                                                BPGoalsDetailBuilderService bpGoalsDetailBuilderService,
                                                BPTemplateDetailsService bpTemplateDetailsService)
    {
        this.layoutGeneratorService = layoutBuilderService;
        this.bpGoalsDetailBuilderService = bpGoalsDetailBuilderService;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
    }

    @Override
    public BPTemplateDetail buildDetail(BPTemplateType bpTemplateType, BPIncomeCriteria incomeCriteria , boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgets)
    {
        BPLayoutGrid layout = layoutGeneratorService.generateLayoutGrid(bpTemplateType, incomeCriteria, requireCategoryHeaders, categoryHeaders, subBudgets);
        saveGridLayout(layout);
        BPTemplateDetail detail = new BPTemplateDetail();
        detail.setLayoutGrid(layout);

        return detail;
    }

    private void saveGridLayout(BPLayoutGrid layout)
    {
        layoutGeneratorService.saveLayoutGrid(layout);
    }

    @Override
    public void saveDetail(BPTemplateDetail detail)
    {
        if(detail == null)
        {
            throw new DataException("Detail cannot be null");
        }
        bpTemplateDetailsService.saveModel(detail);
    }
}
