-- roles
INSERT IGNORE INTO roles(id, role_name) VALUES
	(1, 'ROLE_ADMIN'),
	(2, 'ROLE_GENERAL');
	
-- users
INSERT IGNORE INTO users(id, role_id, user_name, password) VALUES
	(1, 1, 'admin', '$2a$10$Mthkh0N5c4GfDyac0djd7OhhW6.v5IjhNXEcb.ljR.Y.DQDfR54EG'),
	(2, 2, 'guest', '$2a$10$XeekC5ELA45tkKNSGLFCm.NWNir0yG24ZW5toFYX/IYMDSXUkutWS');