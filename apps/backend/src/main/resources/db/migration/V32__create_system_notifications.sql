CREATE TABLE system_notifications (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    version VARCHAR(50),
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    action_url VARCHAR(255),
    mandatory BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    target_roles VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE user_notification_reads (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    read_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_read_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_read_notification FOREIGN KEY (notification_id) REFERENCES system_notifications(id)
);

CREATE INDEX idx_notif_active ON system_notifications(active);
CREATE INDEX idx_read_user_notif ON user_notification_reads(user_id, notification_id);