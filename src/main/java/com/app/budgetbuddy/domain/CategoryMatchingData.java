package com.app.budgetbuddy.domain;

public record CategoryMatchingData(boolean matchByMerchant, String merchantNameMatch, boolean matchByDescription, String descriptionMatch,
                                   boolean matchByAmount, double minAmount, double maxAmount, boolean matchByExtendedDescription, String extendedDescriptionMatch) {
}
