package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.math.BigDecimal;
import java.util.List;

public interface BPTemplateDetailBuilderService
{
    BPTemplateDetail buildDetail(BPTemplateType bpTemplateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgets);
    void saveDetail(BPTemplateDetail detail);
}
