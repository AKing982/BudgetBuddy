package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BPTemplateEntityToModelConverter implements Converter<BPTemplateEntity, BPTemplate>
{
    private final BPTemplateDetailEntityToModelConverter templateDetailEntityToModelConverter;
    private final BPGoalsDetailEntityToModelConverter bpGoalsDetailEntityToModelConverter;

    @Autowired
    public BPTemplateEntityToModelConverter(BPTemplateDetailEntityToModelConverter bpTemplateDetailEntityToModelConverter,
                                            BPGoalsDetailEntityToModelConverter bpGoalsDetailEntityToModelConverter)
    {
        this.templateDetailEntityToModelConverter = bpTemplateDetailEntityToModelConverter;
        this.bpGoalsDetailEntityToModelConverter = bpGoalsDetailEntityToModelConverter;
    }

    @Override
    public BPTemplate convert(BPTemplateEntity bpTemplateEntity)
    {
        return BPTemplate.builder()
                .id(bpTemplateEntity.getId())
                .bpTemplateDetail(templateDetailEntityToModelConverter.convert(bpTemplateEntity.getBpTemplateDetail()))
                .templateType(bpTemplateEntity.getBpTemplateType())
                .isSaved(true)
                .period(bpTemplateEntity.getPeriod())
                .bpGoalsDetail(bpGoalsDetailEntityToModelConverter.convert(bpTemplateEntity.getBpGoalsDetail()))
                .active(true)
                .build();
    }
}
