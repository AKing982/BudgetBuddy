package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class EnvelopeLink
{
    private Long id;
    private List<EnvelopeContribution> envelopes;
    private BigDecimal sharedBudget;
    private String linkStatus;
    private BigDecimal totalContributionAmount;
    private BigDecimal actualContributionAmount;

    public EnvelopeLink(Long id, List<EnvelopeContribution> envelopes, BigDecimal sharedBudget, String linkStatus, BigDecimal totalContributionAmount, BigDecimal actualContributionAmount) {
        this.id = id;
        this.envelopes = envelopes;
        this.sharedBudget = sharedBudget;
        this.linkStatus = linkStatus;
        this.totalContributionAmount = totalContributionAmount;
        this.actualContributionAmount = actualContributionAmount;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeLink that = (EnvelopeLink) o;
        return Objects.equals(id, that.id) && Objects.equals(envelopes, that.envelopes) && Objects.equals(sharedBudget, that.sharedBudget) && Objects.equals(linkStatus, that.linkStatus) && Objects.equals(totalContributionAmount, that.totalContributionAmount) && Objects.equals(actualContributionAmount, that.actualContributionAmount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, envelopes, sharedBudget, linkStatus, totalContributionAmount, actualContributionAmount);
    }
}
