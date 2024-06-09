package com.example.userservice.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.util.regex.Pattern;

@Data
@Embeddable
public class AccountNumber
{
    private String bankCode;
    private String branchCode;
    private String accountNumber;

    private static final Pattern BANK_CODE_PATTERN = Pattern.compile("^[A-Z0-9]{4}$");
    private static final Pattern BRANCH_CODE_PATTERN = Pattern.compile("^[A-Z0-9]{4}$");
    private static final Pattern ACCOUNT_NUMBER_PATTERN = Pattern.compile("^[A-Z0-9]{8,12}$");

    public AccountNumber(String bankCode, String branchCode, String accountNumber) {
        this.bankCode = bankCode;
        this.branchCode = branchCode;
        this.accountNumber = accountNumber;
    }

    public AccountNumber() {

    }

    private boolean isValidAccountNumber(String accountNumber) {
        return ACCOUNT_NUMBER_PATTERN.matcher(accountNumber).matches();
    }

    private boolean isValidBankCode(String bankCode) {
        return BANK_CODE_PATTERN.matcher(bankCode).matches();
    }

    private boolean isValidBranchCode(String branchCode) {
        return BRANCH_CODE_PATTERN.matcher(branchCode).matches();
    }

    @Override
    public String toString() {
        return String.format("%s-%s-%s", bankCode, branchCode, accountNumber);
    }
}
