package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplatePointer;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;

import java.time.LocalDate;
import java.util.Optional;

public interface BPTemplatePointerService extends ServiceModel<BPTemplatePointerEntity>
{
    Optional<BPTemplatePointer> createAndSave(BPTemplatePointer bpTemplatePointer);
    Optional<BPTemplatePointer> findByDateRangeAndTemplateDetailID(Long templateDetailId, LocalDate startDate, LocalDate endDate);
}
