package com.elms.leave.ai.ingestion;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PolicyChunker {

    private static final int CHUNK_SIZE = 2500;
    private static final int OVERLAP = 300;

    public List<String> split(String text) {
        String normalized = text.replace("\r\n", "\n")
                .replaceAll("[\\t ]+", " ")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < normalized.length()) {
            int end = Math.min(start + CHUNK_SIZE, normalized.length());
            if (end < normalized.length()) {
                int paragraphEnd = normalized.lastIndexOf("\n\n", end);
                if (paragraphEnd > start + CHUNK_SIZE / 2) end = paragraphEnd;
            }
            String chunk = normalized.substring(start, end).trim();
            if (!chunk.isBlank()) chunks.add(chunk);
            if (end == normalized.length()) break;
            start = Math.max(end - OVERLAP, start + 1);
        }
        return chunks;
    }
}
