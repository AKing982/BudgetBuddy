package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.services.BPTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BPTemplateRunner
{
    private final BPTemplateService templateService;

    @Autowired
    public BPTemplateRunner(BPTemplateService templateService)
    {
        this.templateService = templateService;
    }

}
