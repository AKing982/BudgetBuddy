package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class BPTemplateToEntityConverter implements Converter<BPTemplate, BPTemplateEntity>
{
    @Override
    public BPTemplateEntity convert(BPTemplate template)
    {
        if(template == null) return null;
        return BPTemplateEntity.builder()
                .id(template.getId())
                .bpTemplateType(template.getTemplateType())
                .period(template.getPeriod())
                .active(template.isActive())
                .isSaved(template.isSaved())
                .build();
    }
}
