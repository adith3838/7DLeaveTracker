package com.elms.leave.ai.ingestion;

import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

@Component
public class PolicyDocumentLoader {

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx", "txt");
    private final Tika tika = new Tika();

    public String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Policy file is empty.");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Policy file exceeds the 10 MB limit.");

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("Upload a PDF, DOCX, or TXT policy document.");
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only PDF, DOCX, and TXT policy documents are supported.");
        }

        try (InputStream input = file.getInputStream()) {
            String mimeType = tika.detect(input, filename);
            boolean compatible = switch (extension) {
                case "pdf" -> "application/pdf".equals(mimeType);
                case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mimeType);
                case "txt" -> "text/plain".equals(mimeType) || "application/octet-stream".equals(mimeType);
                default -> false;
            };
            if (!compatible) throw new IllegalArgumentException("The uploaded content does not match its file extension.");
        }

        try (InputStream input = file.getInputStream()) {
            String text = tika.parseToString(input);
            if (text == null || text.isBlank()) throw new IllegalArgumentException("No readable text found in the policy document.");
            return text;
        } catch (org.apache.tika.exception.TikaException exception) {
            throw new IOException("Could not extract text from this policy document.", exception);
        }
    }
}
