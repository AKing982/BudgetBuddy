package com.app.budgetbuddy.domain;

import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
@Builder
@ToString
@AllArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplate
{
    private Long id;
    private BPTemplateType templateType;
    private Period period;
    private BPGoalsDetail bpGoalsDetail;
    private BPTemplateDetail bpTemplateDetail;
    private boolean active;
    private boolean isSaved;

    public BPTemplate(Long id, BPTemplateType templateType, Period period, BPGoalsDetail bpGoalsDetail, BPTemplateDetail bpTemplateDetail, boolean active)
    {
        this.id = id;
        this.templateType = templateType;
        this.period = period;
        this.bpGoalsDetail = bpGoalsDetail;
        this.bpTemplateDetail = bpTemplateDetail;
        this.active = active;
    }
}
