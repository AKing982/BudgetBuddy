package com.app.budgetbuddy.domain;

import java.util.List;

public record EnvelopeCreateRequest(List<NewEnvelopeCriteria> criteria, boolean isLinked) {
}
