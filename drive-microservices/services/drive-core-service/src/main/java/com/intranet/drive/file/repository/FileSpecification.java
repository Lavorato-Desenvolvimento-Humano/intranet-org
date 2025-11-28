package com.intranet.drive.file.repository;

import com.intranet.drive.file.entity.FileEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class FileSpecification {

    public static Specification<FileEntity> withFilter(String name, String mimeType,
                                                       LocalDateTime startDate, LocalDateTime endDate,
                                                       Long minSize, Long maxSize, Long ownerId) {
        return (root, query, cb) -> {
            Specification<FileEntity> spec = Specification.where(null);

            // Filtro básico de não deletado
            spec = spec.and((rootSpec, querySpec, cbSpec) -> cbSpec.equal(rootSpec.get("isDeleted"), false));

            if (name != null && !name.isEmpty()) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.like(cbSpec.lower(rootSpec.get("name")), "%" + name.toLowerCase() + "%"));
            }

            if (mimeType != null && !mimeType.isEmpty()) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.equal(rootSpec.get("mimeType"), mimeType));
            }

            if (startDate != null) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.greaterThanOrEqualTo(rootSpec.get("createdAt"), startDate));
            }

            if (endDate != null) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.lessThanOrEqualTo(rootSpec.get("createdAt"), endDate));
            }

            if (minSize != null) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.greaterThanOrEqualTo(rootSpec.get("fileSize"), minSize));
            }

            if (maxSize != null) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.lessThanOrEqualTo(rootSpec.get("fileSize"), maxSize));
            }

            if (ownerId != null) {
                spec = spec.and((rootSpec, querySpec, cbSpec) ->
                        cbSpec.equal(rootSpec.get("ownerId"), ownerId));
            }

            return spec.toPredicate(root, query, cb);
        };
    }
}
