package com.app.budgetbuddy.domain;

import lombok.*;

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

}
