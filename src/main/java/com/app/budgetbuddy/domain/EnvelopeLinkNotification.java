package com.app.budgetbuddy.domain;

import java.util.List;

public record EnvelopeLinkNotification(EnvelopeLink envelopeLink, List<EnvelopeNotification> envelopeNotifications) {
}
