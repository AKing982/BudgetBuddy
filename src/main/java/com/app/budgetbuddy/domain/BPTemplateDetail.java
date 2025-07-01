package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplateDetail
{
    private Long id;
    private Long bp_template_id;
    private String bpTemplateName;
    private boolean isFiftyThirtyTwentyRuleApplied;
    private List<BPWeekDetail> weekDetails = new ArrayList<>();

    public BPTemplateDetail(Long id, Long bp_template_id, String bpTemplateName, boolean isFiftyThirtyTwentyRuleApplied)
    {
        this.id = id;
        this.bp_template_id = bp_template_id;
        this.bpTemplateName = bpTemplateName;
        this.isFiftyThirtyTwentyRuleApplied = isFiftyThirtyTwentyRuleApplied;
    }

    public Optional<BPWeekDetail> getWeekDetailByRange(final DateRange dateRange)
    {
        return weekDetails.stream()
                .filter(weekDetail -> weekDetail.getWeekRange().equals(dateRange))
                .findFirst();
    }

    public void addWeekDetail(BPWeekDetail weekDetail)
    {
        weekDetails.add(weekDetail);
    }

    public void removeWeekDetail(BPWeekDetail bpWeekDetail)
    {
        weekDetails.remove(bpWeekDetail);
    }
}
