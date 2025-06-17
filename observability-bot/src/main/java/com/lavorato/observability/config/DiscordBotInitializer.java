package com.lavorato.observability.config;

import com.lavorato.observability.discord.DiscordCommandHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializador que configura o bot Discord após todos os beans estarem prontos
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiscordBotInitializer implements ApplicationRunner {

    private final JDA jda;
    private final DiscordCommandHandler commandHandler;

    @Value("${discord.guild.id}")
    private String guildId;

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Inicializando configurações do Discord Bot...");

            // Adicionar event listeners
            jda.addEventListener(commandHandler);

            // Registrar comandos slash
            registerSlashCommands();

            log.info("Discord Bot configurado com sucesso!");

        } catch (Exception e) {
            log.error("Erro ao inicializar Discord Bot: ", e);
        }
    }

    /**
     * Registra comandos slash no Discord
     */
    private void registerSlashCommands() {
        try {
            log.info("Registrando comandos slash...");

            if (guildId != null && !guildId.isEmpty()) {
                jda.getGuildById(guildId)
                        .updateCommands()
                        .addCommands(commandHandler.getSlashCommands())
                        .queue(
                                success -> log.info("Comandos slash registrados com sucesso no guild!"),
                                error -> log.error("Erro ao registrar comandos slash: ", error)
                        );
            } else {
                jda.updateCommands()
                        .addCommands(commandHandler.getSlashCommands())
                        .queue(
                                success -> log.info("Comandos slash registrados globalmente!"),
                                error -> log.error("Erro ao registrar comandos slash globalmente: ", error)
                        );
            }
        } catch (Exception e) {
            log.error("Erro ao registrar comandos slash: ", e);
        }
    }
}
