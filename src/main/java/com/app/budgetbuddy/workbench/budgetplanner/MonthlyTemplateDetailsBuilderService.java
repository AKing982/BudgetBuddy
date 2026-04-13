package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
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
        BPTemplateDetail detail = new BPTemplateDetail();
        detail.setLayoutGrid(layout);
        detail.setLayoutType(BPLayoutType.CLASSIC);
//        BPTemplateDetail savedDetail = saveDetail(detail);
//        saveGridLayout(layout, detail);
        return detail;
    }

    private void saveGridLayout(BPLayoutGrid layout, BPTemplateDetail detail)
    {
        layoutGeneratorService.saveLayoutGrid(layout, detail);
    }

    @Override
    public BPTemplateDetailEntity saveDetail(BPTemplateDetail detail, BPTemplateEntity template)
    {
        if(detail == null)
        {
            throw new DataException("Detail cannot be null");
        }
        return bpTemplateDetailsService.saveModel(detail, template);
    }
}
