package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
@ToString
public class EnvelopeContribution
{
    private Long id;
    private Envelope envelope;
    private List<Contributions> contributions;

    public EnvelopeContribution(Long id, Envelope envelope, List<Contributions> contributions) {
        this.id = id;
        this.envelope = envelope;
        this.contributions = contributions;
    }

    public Contributions findContributionsForDate(LocalDate date)
    {
        if(contributions == null || contributions.isEmpty())
        {
            throw new IllegalStateException("No contributions present on this EnvelopeContribution");
        }
        return contributions.stream()
                .filter(e -> e.getContributionDate() != null && e.getContributionDate().isEqual(date))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No contributions found for date: " + date));
    }


    public List<EnvelopeContribution> splitByContribution()
    {
        if(contributions == null || contributions.isEmpty())
        {
            return Collections.emptyList();
        }
        return contributions.stream()
                .map(singleContribution -> EnvelopeContribution.builder()
                        .envelope(this.envelope)
                        .contributions(List.of(singleContribution))
                        .build())
                .toList();
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeContribution that = (EnvelopeContribution) o;
        return Objects.equals(id, that.id) && Objects.equals(envelope, that.envelope) && Objects.equals(contributions, that.contributions);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, envelope, contributions);
    }
}
