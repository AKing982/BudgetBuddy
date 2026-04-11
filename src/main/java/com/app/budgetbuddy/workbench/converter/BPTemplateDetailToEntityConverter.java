package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.stereotype.Component;

@Component
public class BPTemplateDetailToEntityConverter implements Converter<BPTemplateDetail, BPTemplateDetailEntity>
{

    @Override
    public BPTemplateDetailEntity convert(BPTemplateDetail bpTemplateDetail)
    {
//        BPTemplateDetailEntity bpTemplateDetailEntity = new BPTemplateDetailEntity();
//        bpTemplateDetailEntity.setBpTypeName(bpTemplateDetail.getTemplateType().name());
//        bpTemplateDetailEntity.setLastUpdated(bpTemplateDetail.getLastUpdated());
//        bpTemplateDetailEntity.setCreatedAt(bpTemplateDetail.getCreatedAt());
//        if(bpTemplateDetail.getRollingDetail() != null)
//        {
//            bpTemplateDetailEntity.setClassic(bpTemplateDetailEntity.isClassic());
//            bpTemplateDetailEntity.setVisual(bpTemplateDetailEntity.isVisual());
//            bpTemplateDetailEntity.setColumns();
//        }
//        return null;
        return null;
    }
}
