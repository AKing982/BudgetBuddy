package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
@AllArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplateDetail
{
    private Long id;
    private Long bp_template_id;
    private BPTemplateType templateType;
    private BPRollingDetail rollingDetail;
    private BPKpiDetail bpKpiDetail;
    private boolean isSaved;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;
}
