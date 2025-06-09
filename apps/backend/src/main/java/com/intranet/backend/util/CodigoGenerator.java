package com.intranet.backend.util;

import org.springframework.stereotype.Component;

import java.util.Random;
import java.util.UUID;

@Component
public class CodigoGenerator {

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final Random random = new Random();

    public String gerarCodigo() {
        StringBuilder codigo = new StringBuilder(CODE_LENGTH);

        for (int i = 0; i < CODE_LENGTH; i++) {
            codigo.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }

        return codigo.toString();
    }

    public String gerarCodigoFichaFromUUID(UUID id) {
        return id.toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase();
    }
}
