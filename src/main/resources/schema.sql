-- roles
CREATE TABLE IF NOT EXISTS roles (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	role_name VARCHAR(50) NOT NULL
);

-- users
CREATE TABLE IF NOT EXISTS users (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	role_id INT NOT NULL,
	user_name VARCHAR(50) NOT NULL,
	password VARCHAR(255) NOT NULL,
	enabled BOOLEAN NOT NULL DEFAULT true,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- connects
CREATE TABLE IF NOT EXISTS connects (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	room_name VARCHAR(255),
	room_id VARCHAR(255),
	member_id VARCHAR(255),
	video_flg BOOLEAN NOT NULL DEFAULT false,
	video_id VARCHAR(255),
	audio_flg BOOLEAN NOT NULL DEFAULT false,
	audio_id VARCHAR(255),
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id)
);