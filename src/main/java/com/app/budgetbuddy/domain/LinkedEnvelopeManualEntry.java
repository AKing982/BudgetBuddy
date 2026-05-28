package com.app.budgetbuddy.domain;

import java.util.List;

public record LinkedEnvelopeManualEntry(EnvelopeLink envelopeLink, List<EnvelopeManualEntry> envelopeManualEntries) {
}
