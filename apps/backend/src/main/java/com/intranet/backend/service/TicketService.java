package com.intranet.backend.service;

import com.intranet.backend.dto.DashboardStatsDto;
import com.intranet.backend.dto.TicketCreateRequest;
import com.intranet.backend.dto.TicketRatingRequest;
import com.intranet.backend.dto.TicketResponseDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EquipeRepository equipeRepository;
    private final TicketSlaConfigRepository ticketSlaConfigRepository;
    private final TicketInteractionRepository interactionRepository;
    private final UserEquipeRepository userEquipeRepository;

    @Value("${app.upload.dir:/app/uploads")
    private String uploadDir;

    public List<TicketResponseDto> getAllTickets(String assigneeIdFilter, String requesterIdFilter, String statusFilter) {
        User currentUser = getCurrentUser();
        List<Ticket> tickets = List.of();

        // 1. "Meus Atendimentos" (assigneeId=me)
        if ("me".equalsIgnoreCase(assigneeIdFilter)) {
            List<TicketStatus> statuses = parseStatuses(statusFilter);
            tickets = ticketRepository.findByAssigneeIdAndStatusInOrderByPriorityDesc(currentUser.getId(), statuses);
        }

        // 2. "Fila da Equipe" (assigneeId=null & status=OPEN)
        if ("null".equalsIgnoreCase(assigneeIdFilter)) {
            // Busca os IDs das equipes que o usuário participa
            List<UUID> myTeamIds = userEquipeRepository.findEquipeIdsByUserId(currentUser.getId());

            if (myTeamIds.isEmpty()) return List.of();

           tickets = ticketRepository.findQueueByTeamIds(myTeamIds);
        }

        // 3. "Meus Pedidos" (requesterId=me)
        if ("me".equalsIgnoreCase(requesterIdFilter)) {
            tickets = ticketRepository.findByRequesterIdOrderByCreatedAtDesc(currentUser.getId());
        }

        return tickets.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }


    @Transactional
    public Ticket createTicket(TicketCreateRequest dto, MultipartFile file) {
        User requester = getCurrentUser();

        Equipe targetTeam = equipeRepository.findById(dto.targetTeamId())
                .orElseThrow(() -> new RuntimeException("Equipe não encontrada com ID: " + dto.targetTeamId()));

        Ticket ticket = Ticket.builder()
                .title(dto.title())
                .description(dto.description())
                .priority(dto.priority())
                .status(TicketStatus.OPEN)
                .requester(requester)
                .targetTeam(targetTeam)
                .dueDate(calculateDueDate(dto.priority()))
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        if (file != null && !file.isEmpty()) {
            String fileName = saveFileLocally(file, savedTicket.getId());

            TicketInteraction attachment = TicketInteraction.builder()
                    .ticket(savedTicket)
                    .user(requester)
                    .type(InteractionType.ATTACHMENT)
                    .content("Anexo enviado na abertura do chamado: " + file.getOriginalFilename())
                    .attachmentUrl(fileName)
                    .build();

            interactionRepository.save(attachment);
        }

        return savedTicket;
    }

    @Transactional
    public Ticket claimTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado: " + ticketId));

        if (ticket.getAssignee() != null) {
            throw new IllegalStateException("Este ticket já está atribuído ao usuário: " + ticket.getAssignee());
        }

        User technician = getCurrentUser();

        if (ticket.getTargetTeam() != null) {
            boolean isMember = userEquipeRepository.existsByUserIdAndEquipeId(
                    technician.getId(),
                    ticket.getTargetTeam().getId()
            );

            if (!isMember) {
                throw new AccessDeniedException(
                        "Você não pertence à equipe " + ticket.getTargetTeam().getNome() + " e não pode assumir este chamado."
                );
            }
        }

        ticket.setAssignee(technician);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        Ticket savedTicket = ticketRepository.save(ticket);

        logSystemEvent(savedTicket, "Ticket assumido por: " + technician.getFullName());

        return savedTicket;
    }

    @Transactional
    public TicketInteraction addComent(Long ticketId, String content) {
        Ticket ticket = getTicketById(ticketId);
        User currentUser = getCurrentUser();

        TicketInteraction interaction = TicketInteraction.builder()
                .ticket(ticket)
                .user(currentUser)
                .type(InteractionType.COMMENT)
                .content(content)
                .build();

        return interactionRepository.save(interaction);
    }

    @Transactional
    public Ticket resolveTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);

        // Regra: Só pode resolver se já estiver em atendimento
        if (ticket.getStatus() == TicketStatus.OPEN) {
            throw new IllegalStateException("O ticket precisa ser assumido antes de ser resolvido.");
        }

        ticket.setStatus(TicketStatus.RESOLVED); // Ou CLOSED, dependendo do seu fluxo
        ticket.setClosedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);
        logSystemEvent(saved, "Ticket marcado como resolvido pelo técnico.");

        return saved;
    }

    @Transactional
    public Ticket rateTicket(Long ticketId, TicketRatingRequest request) {
        Ticket ticket = getTicketById(ticketId);
        User currentUser = getCurrentUser();

        // Segurança: Só o dono do ticket pode avaliar
        if (!ticket.getRequester().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Apenas o solicitante pode avaliar este ticket.");
        }

        if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
            throw new IllegalStateException("O ticket precisa estar resolvido para ser avaliado.");
        }

        ticket.setRating(request.rating());
        ticket.setRatingComment(request.comment());

        // Opcional: Se avaliar, já move para CLOSED definitivo
        if (ticket.getStatus() == TicketStatus.RESOLVED) {
            ticket.setStatus(TicketStatus.CLOSED);
            logSystemEvent(ticket, "Ticket avaliado e fechado definitivamente pelo usuário. Nota: " + request.rating());
        }

        return ticketRepository.save(ticket);
    }

    public DashboardStatsDto getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        long openTickets = ticketRepository.countOpenTickets();
        long closedToday = ticketRepository.countClosedToday(startOfDay);
        Double avgRating = ticketRepository.getAverageRating(); // Pode vir null

        // Cálculo de SLA %
        long totalClosed = ticketRepository.countTotalClosedTickets();
        long withinSla = ticketRepository.countTicketsWithinSla();
        double slaPercentage = totalClosed > 0 ? ((double) withinSla / totalClosed) * 100 : 100.0;

        // Mapas para Gráficos
        Map<String, Long> byStatus = ticketRepository.countTicketsByStatus().stream()
                .collect(Collectors.toMap(row -> ((TicketStatus) row[0]).name(), row -> (Long) row[1]));

        Map<String, Long> byPriority = ticketRepository.countTicketsByPriority().stream()
                .collect(Collectors.toMap(row -> ((TicketPriority) row[0]).name(), row -> (Long) row[1]));

        return new DashboardStatsDto(
                openTickets,
                closedToday,
                slaPercentage,
                avgRating != null ? avgRating : 0.0,
                byStatus,
                byPriority
        );
    }

    public List<TicketInteraction> getTicketTimeLine(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket não encontrado: " + ticketId);
        }
        return interactionRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    public TicketResponseDto getTicketByIdResponse(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);
        return toDto(ticket);
    }

    public Ticket getTicketById(Long ticketId) {
        return (ticketRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado: " + ticketId)));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário logado não encontrado no banco de dados."));
    }

    private LocalDateTime calculateDueDate(TicketPriority priority) {
       int hoursToAdd = ticketSlaConfigRepository.findById(priority)
               .map(TicketSlaConfig::getSlaHours)
               .orElse(24);

       return LocalDateTime.now().plusHours(hoursToAdd);
    }

    private void logSystemEvent(Ticket ticket, String message) {
        TicketInteraction log = TicketInteraction.builder()
                .ticket(ticket)
                .user(null)
                .type(InteractionType.SYSTEM_LOG)
                .content(message)
                .build();
        interactionRepository.save(log);
    }

    private String saveFileLocally(MultipartFile file, Long ticketId) {
        try {
            // Cria estrutura /app/uploads/tickets/1001/
            Path targetDir = Paths.get(uploadDir, "tickets", String.valueOf(ticketId));

            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Sanitiza o nome do arquivo para evitar problemas com caracteres especiais
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) originalFilename = "arquivo_sem_nome";

            // Gera nome único: uuid_nome-do-arquivo.pdf
            String fileName = UUID.randomUUID() + "_" + originalFilename;
            Path targetPath = targetDir.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Ex: tickets/1001/uuid_arquivo.pdf
            return "tickets/" + ticketId + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Falha ao salvar anexo", e);
        }
    }

    private List<TicketStatus> parseStatuses(String statusFilter) {
        if (statusFilter == null || statusFilter.isEmpty()) {
            return Arrays.asList(TicketStatus.values());
        }
        return Arrays.stream(statusFilter.split(","))
                .map(String::trim)
                .map(TicketStatus::valueOf)
                .collect(Collectors.toList());
    }

    private TicketResponseDto toDto(Ticket ticket) {
        return new TicketResponseDto(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getCreatedAt(),
                ticket.getDueDate(),
                ticket.getClosedAt(),
                ticket.getRating(),
                ticket.getRatingComment(),
                // Null checks são importantes aqui
                ticket.getRequester().getId(),
                ticket.getRequester().getFullName(),
                ticket.getRequester().getEmail(),
                ticket.getAssignee() != null ? ticket.getAssignee().getId() : null,
                ticket.getAssignee() != null ? ticket.getAssignee().getFullName() : null,
                ticket.getTargetTeam() != null ? ticket.getTargetTeam().getId() : null,
                ticket.getTargetTeam() != null ? ticket.getTargetTeam().getNome() : null
        );
    }
}
