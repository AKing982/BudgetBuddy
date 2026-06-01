package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class LinkEnvelopeDetails
{
    private EnvelopeLink envelopeLink;
    private List<Contributions> contributions;
    private List<EnvelopeNotification> envelopeLinkNotification;
    private String errorMessage;

    public LinkEnvelopeDetails(EnvelopeLink envelopeLink, List<Contributions> contributions, List<EnvelopeNotification> envelopeLinkNotification, String errorMessage) {
        this.envelopeLink = envelopeLink;
        this.contributions = contributions;
        this.envelopeLinkNotification = envelopeLinkNotification;
        this.errorMessage = errorMessage;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        LinkEnvelopeDetails that = (LinkEnvelopeDetails) o;
        return Objects.equals(envelopeLink, that.envelopeLink) && Objects.equals(contributions, that.contributions) && Objects.equals(envelopeLinkNotification, that.envelopeLinkNotification) && Objects.equals(errorMessage, that.errorMessage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelopeLink, contributions, envelopeLinkNotification, errorMessage);
    }
}

