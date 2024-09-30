package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record RecurringTransactionRequest(@JsonProperty("outflowStreams") List<RecurringTransactionDTO> outflowStreams,
                                          @JsonProperty("inflowStreams") List<RecurringTransactionDTO> inflowStreams)
{

}
