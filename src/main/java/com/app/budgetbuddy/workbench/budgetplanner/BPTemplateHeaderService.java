package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPTemplateHeader;

import java.util.ArrayList;
import java.util.List;

public class BPTemplateHeaderService
{
    private List<BPTemplateHeader> headers = new ArrayList<>();
    private String[] standardTemplateHeaderElements = new String[]{"Week", "Category", "Budgeted", "Spending %", "Savings %", "Remaining", "Balance"};
    private String[] monthlyTemplateHeaderElements = new String[]{"Week", "Category", "Budgeted", "Spending %", "Savings %", "Remaining"};
    private String[] monthlyGoalsTemplateHeaderElements = new String[]{"Week", "Category", "Category Goal Amount", "Total Saved", "Goal Met %"};

    public List<BPTemplateHeader> createHeaderByTemplateType(String templateType)
    {
        switch(templateType){
            case "Three Monthly Standard Template":
            case "Monthly Standard Template":
            case "50/30/20 Monthly Template":
            case "50/30/20 Bi-Weekly Template":
            case "Bi-Weekly Standard Template":
                headers.addAll(addTemplateHeaderElements(standardTemplateHeaderElements));
                break;
            case "Monthly Template":
            case "Bi-Weekly Template":
                headers.addAll(addTemplateHeaderElements(monthlyTemplateHeaderElements));
                break;
            case "Standard Monthly Goals Template":
            case "Standard Bi-Weekly Goals Template":
                headers.addAll(addTemplateHeaderElements(monthlyGoalsTemplateHeaderElements));
            default:
                throw new IllegalArgumentException("Invalid template type");
        }
        return headers;
    }

    private List<BPTemplateHeader> addTemplateHeaderElements(String[] elements)
    {
        List<BPTemplateHeader> headers = new ArrayList<>();
        for(String element : elements)
        {
            headers.add(new BPTemplateHeader(element));
        }
        return headers;
    }
}
