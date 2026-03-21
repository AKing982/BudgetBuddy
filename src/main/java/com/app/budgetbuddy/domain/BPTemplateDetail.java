package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
@AllArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplateDetail
{
    private Long id;
    private Long bp_template_id;
    private boolean isClassic;
    private boolean isVisual;
    private List<BudgetCategoryGroup> budgetCategoryGroupList = new ArrayList<>();
    private Set<BudgetCategory> budgetCategorySet = new HashSet<>();
    private Set<BPAccountBalance> bpAccountBalanceSet = new HashSet<>();
    private Map<DateRange, BigDecimal> totalPeriodSaved = new HashMap<>();
    private Map<DateRange, BigDecimal> totalPeriodIncome = new HashMap<>();
    private Map<DateRange, BigDecimal> totalRemainingBalances = new HashMap<>();
    
}
