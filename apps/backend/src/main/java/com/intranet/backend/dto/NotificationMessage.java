package com.intranet.backend.dto;

public record NotificationMessage(String title, String message, Long ticketId, String type) {
}
