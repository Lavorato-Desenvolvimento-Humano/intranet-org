package com.lavorato.observability.config;

import com.lavorato.observability.discord.DiscordCommandHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.entities.Activity;
import net.dv8tion.jda.api.requests.GatewayIntent;
import net.dv8tion.jda.api.utils.ChunkingFilter;
import net.dv8tion.jda.api.utils.MemberCachePolicy;
import net.dv8tion.jda.api.utils.cache.CacheFlag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.security.auth.login.LoginException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

/**
 * Configuração do bot Discord e seus componentes
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class BotConfiguration {

    @Value("${discord.bot.token}")
    private String botToken;

    @Value("${discord.guild.id}")
    private String guildId;

    private final DiscordCommandHandler commandHandler;

    /**
     * Configura e inicializa o JDA (Java Discord API)
     */
    @Bean
    public JDA jda() throws LoginException, InterruptedException {
        log.info("Configurando conexão com Discord...");

        JDA jda = JDABuilder.createDefault(botToken)
                // Configurar intents necessários
                .enableIntents(
                        GatewayIntent.GUILD_MESSAGES,
                        GatewayIntent.MESSAGE_CONTENT,
                        GatewayIntent.GUILD_MEMBERS
                )
                // Configurar cache para otimizar performance
                .setMemberCachePolicy(MemberCachePolicy.VOICE.or(MemberCachePolicy.OWNER))
                .setChunkingFilter(ChunkingFilter.include(Long.parseLong(guildId)))
                .disableCache(CacheFlag.ACTIVITY, CacheFlag.CLIENT_STATUS)
                // Configurar atividade do bot
                .setActivity(Activity.watching("Sistema Lavorato 🔍"))
                // Adicionar event listeners
                .addEventListeners(commandHandler)
                // Build e aguarda estar pronto
                .build()
                .awaitReady();

        log.info("Bot conectado com sucesso! ID: {}", jda.getSelfUser().getId());
        log.info("Bot está em {} servidores", jda.getGuilds().size());

        // Registrar comandos slash
        registerSlashCommands(jda);

        return jda;
    }

    /**
     * Registra comandos slash no Discord
     */
    private void registerSlashCommands(JDA jda) {
        try {
            log.info("Registrando comandos slash...");

            // Registrar comandos globalmente (pode demorar até 1 hora para aparecer)
            // Para desenvolvimento, usar updateCommands() no guild específico
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

    /**
     * Executor service para tarefas agendadas de monitoramento
     */
    @Bean
    public ScheduledExecutorService scheduledExecutorService() {
        return Executors.newScheduledThreadPool(10, r -> {
            Thread t = new Thread(r, "ObservabilityBot-Scheduler");
            t.setDaemon(true);
            return t;
        });
    }
}