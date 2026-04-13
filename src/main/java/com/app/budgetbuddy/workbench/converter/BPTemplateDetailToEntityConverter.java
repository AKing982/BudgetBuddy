package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.stereotype.Component;

@Component
public class BPTemplateDetailToEntityConverter implements Converter<BPTemplateDetail, BPTemplateDetailEntity>
{

    @Override
    public BPTemplateDetailEntity convert(BPTemplateDetail detail)
    {
        if(detail == null) return null;
        return BPTemplateDetailEntity.builder()
                .layoutType(detail.getLayoutType())
                .id(detail.getId())
                .createdAt(detail.getCreatedAt())
                .lastUpdated(detail.getLastUpdated())
                .build();
    }
}
