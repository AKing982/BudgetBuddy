package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPTemplatePointer;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;
import com.app.budgetbuddy.repositories.BPTemplateDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BPTemplatePointerToEntityConverter implements Converter<BPTemplatePointer, BPTemplatePointerEntity>
{
    private final BPTemplateDetailsRepository bpTemplateDetailsRepository;

    @Autowired
    public BPTemplatePointerToEntityConverter(BPTemplateDetailsRepository bpTemplateDetailsRepository)
    {
        this.bpTemplateDetailsRepository = bpTemplateDetailsRepository;
    }

    @Override
    public BPTemplatePointerEntity convert(BPTemplatePointer bpTemplatePointer)
    {
        BPTemplatePointerEntity bpTemplatePointerEntity = new BPTemplatePointerEntity();
        BPTemplateDetailEntity bpTemplateDetailEntity = bpTemplateDetailsRepository.findById(bpTemplatePointer.getTemplateDetailId())
                .orElseThrow(() -> new IllegalArgumentException("Template Detail not found"));
        bpTemplatePointerEntity.setBpTemplateDetail(bpTemplateDetailEntity);
        bpTemplatePointerEntity.setPointerMode(bpTemplatePointer.getPointerMode().toString());
        bpTemplatePointerEntity.setLocked(bpTemplatePointer.isLocked());
        bpTemplatePointerEntity.setStatus(bpTemplatePointer.getStatus());
        bpTemplatePointerEntity.setUpdateEnabled(bpTemplatePointer.isUpdateEnabled());
        bpTemplatePointerEntity.setRangeStartDate(bpTemplatePointer.getCurrentDateRange().getStartDate().toString());
        bpTemplatePointerEntity.setRangeEndDate(bpTemplatePointer.getCurrentDateRange().getEndDate().toString());
        return bpTemplatePointerEntity;
    }
}
