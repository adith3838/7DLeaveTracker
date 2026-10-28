package com.elms.leave.ai.service;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class IntentRouter {

    public Intent classify(String message) {
        String text = message.toLowerCase(Locale.ROOT);
        if (text.contains("policy") || text.contains("entitlement") || text.contains("eligible")
                || text.contains("probation") || text.contains("carry forward")) {
            return Intent.POLICY_QUESTION;
        }
        if (text.contains("apply for leave") || text.contains("submit leave")
                || text.contains("request leave") || text.contains("book leave")
                || text.contains("raise") || text.contains("take leave")
                || text.contains("apply leave") || text.contains("sick leave for")) {
            return Intent.APPLY_LEAVE;
        }
        if (text.contains("balance") || text.contains("remaining leave") || text.contains("days left")
                || (text.contains("how many") && text.contains("leave"))
                || text.contains("leave do i have") || text.contains("leave days do i have")
                || text.contains("my leave days")) {
            return Intent.LEAVE_BALANCE;
        }
        if (text.contains("holiday") || text.contains("public holiday")) {
            return Intent.HOLIDAY_QUERY;
        }
        if (text.contains("status") || text.contains("approved") || text.contains("pending")
                || text.contains("rejected") || text.contains("my request")) {
            return Intent.LEAVE_STATUS;
        }
        return Intent.POLICY_QUESTION;
    }

    public enum Intent {
        POLICY_QUESTION, LEAVE_BALANCE, LEAVE_STATUS, HOLIDAY_QUERY, APPLY_LEAVE
    }
}
