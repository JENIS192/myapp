CREATE DATABASE IF NOT EXISTS vehicle_store;
USE vehicle_store;
CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,email VARCHAR(150) NOT NULL UNIQUE,password_hash VARCHAR(100) NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS vehicles(id INT AUTO_INCREMENT PRIMARY KEY,brand ENUM('Koenigsegg','BMW') NOT NULL,model VARCHAR(100) NOT NULL,tagline VARCHAR(160),year SMALLINT,price DECIMAL(12,2) NOT NULL,hp INT,top_speed_kmh INT,zero_to_100 DECIMAL(3,1),stock INT NOT NULL DEFAULT 1,description TEXT,accent VARCHAR(7) DEFAULT '#1c69d4',INDEX(brand));
CREATE TABLE IF NOT EXISTS orders(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,total DECIMAL(14,2) NOT NULL,status VARCHAR(20) DEFAULT 'placed',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items(id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,vehicle_id INT NOT NULL,qty INT NOT NULL,unit_price DECIMAL(12,2) NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(vehicle_id) REFERENCES vehicles(id));
INSERT INTO vehicles(brand,model,tagline,year,price,hp,top_speed_kmh,zero_to_100,stock,description,accent) VALUES
('Koenigsegg','Jesko Absolut','Built for one thing: the highest top speed.',2026,3400000,1600,500,2.5,2,'Low-drag Absolut body, twin-turbo 5.0L V8 and 9-speed Light Speed Transmission, with a design target above 500 km/h.','#c9b27c'),
('Koenigsegg','Jesko Attack','Track-focused with huge downforce.',2025,3000000,1600,430,2.5,2,'Aggressive aero package and Light Speed Transmission tuned for lap times.','#d9d4c7'),
('Koenigsegg','Gemera','The four-seat mega-GT.',2025,1700000,1700,400,1.9,3,'Hybrid four-seater with a 2.0L tiny friendly giant engine and three electric motors.','#9aa3ab'),
('Koenigsegg','Regera','Direct-drive hybrid hypercar.',2023,1900000,1500,410,2.8,1,'Twin-turbo V8 plus electric motors with a single-gear direct drive.','#7a8691'),
('BMW','M3 Competition','Everyday super sedan.',2026,86000,503,290,3.4,12,'3.0L twin-turbo inline-6 with xDrive and 8-speed M Steptronic.','#1c69d4'),
('BMW','M4 CSL','Lightweight track-bred coupe.',2025,145000,543,307,3.5,5,'Weight-reduced M4 with carbon roof and sharper chassis tuning.','#6a2fb0'),
('BMW','M5 CS','The most powerful series M sedan.',2025,142000,627,305,2.9,6,'4.4L V8 plug-in hybrid with M xDrive.','#e22718'),
('BMW','M8 Competition Coupe','Grand-touring performance.',2025,138000,617,305,3.2,4,'4.4L twin-turbo V8 with M xDrive and rear-biased handling.','#1c69d4'),
('BMW','iX M60','Electric performance SUV.',2026,111000,610,250,3.6,8,'Dual-motor electric SUV with over 500 km of range.','#2a8f6a'),
('BMW','S 1000 RR','Superbike for the road and track.',2026,18500,205,299,3.1,10,'999cc inline-4 with ShiftCam and M Package options.','#e22718');
