package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BPTemplatePointer
{
    private Long id;
    private Long templateDetailId;
    private PointerMode pointerMode;
    private DateRange currentDateRange;
    private boolean isUpdateEnabled;
    private boolean isLocked;
    private String status;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BPTemplatePointer that = (BPTemplatePointer) o;
        return isUpdateEnabled == that.isUpdateEnabled && isLocked == that.isLocked && Objects.equals(id, that.id) && Objects.equals(templateDetailId, that.templateDetailId) && pointerMode == that.pointerMode && Objects.equals(currentDateRange, that.currentDateRange) && Objects.equals(status, that.status);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, templateDetailId, pointerMode, currentDateRange, isUpdateEnabled, isLocked, status);
    }
}
