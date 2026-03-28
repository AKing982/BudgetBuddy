package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.domain.BPTemplateType;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
@Qualifier("monthlyTemplateBuilder")
public class MonthlyTemplateDetailsBuilderService implements BPTemplateDetailBuilderService
{
    private final BPLayoutBuilderService layoutBuilderService;
    private final BPTemplateDetailsService bpTemplateDetailsService;

    @Autowired
    public MonthlyTemplateDetailsBuilderService(@Qualifier("monthlyLayoutBuilder") BPLayoutBuilderService layoutBuilderService,
                                                BPTemplateDetailsService bpTemplateDetailsService)
    {
        this.layoutBuilderService = layoutBuilderService;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
    }

    @Override
    public BPTemplateDetail buildDetail(BPTemplateType bpTemplateType)
    {
        return null;
    }

    @Override
    public BPTemplateDetail saveDetail(BPTemplateDetail detail) {
        return null;
    }
}
