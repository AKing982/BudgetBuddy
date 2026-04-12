package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.stereotype.Component;

@Component
public class BPTemplateDetailEntityToModelConverter implements Converter<BPTemplateDetailEntity, BPTemplateDetail>
{
    @Override
    public BPTemplateDetail convert(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        return BPTemplateDetail.builder()
                .layoutType(bpTemplateDetailEntity.getLayoutType())
                .templateId(bpTemplateDetailEntity.getBpTemplate().getId())
                .build();
    }
}
